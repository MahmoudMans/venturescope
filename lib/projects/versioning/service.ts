import {
  prisma,
} from "@/lib/db/prisma";

import {
  logProjectVersionEvent,
} from "@/lib/projects/versioning/audit";

import {
  parseProjectRevisionSnapshot,
  prepareRelationRows,
} from "@/lib/projects/versioning/serialization";

import {
  PROJECT_REVISION_SCHEMA_VERSION,
  type ProjectRevisionSnapshot,
} from "@/lib/projects/versioning/types";


function serialize(
  value:
    unknown,
): unknown {
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as
    unknown;
}


function snapshotFromProject(
  project: {
    name:
      string;

    industry:
      string |
      null;

    currency:
      string;

    startMonth:
      Date;

    horizonMonths:
      number;

    revenueMode:
      unknown;

    baseAssumptions:
      unknown;

    scenarios:
      unknown[];

    financingEvents:
      unknown[];

    monthlyOverrides:
      unknown[];
  },
): ProjectRevisionSnapshot {
  return parseProjectRevisionSnapshot(
    serialize({
      schemaVersion:
        PROJECT_REVISION_SCHEMA_VERSION,

      capturedAt:
        new Date()
          .toISOString(),

      project: {
        name:
          project.name,

        industry:
          project.industry,

        currency:
          project.currency,

        startMonth:
          project.startMonth,

        horizonMonths:
          project.horizonMonths,

        revenueMode:
          project.revenueMode,

        baseAssumptions:
          project.baseAssumptions,
      },

      scenarios:
        project.scenarios,

      financingEvents:
        project.financingEvents,

      monthlyOverrides:
        project.monthlyOverrides,
    }),
  );
}


export async function createProjectRevision({
  projectId,
  actorUserId,
  label,
  reason,
}: {
  projectId:
    string;

  actorUserId:
    string;

  label:
    string |
    null;

  reason:
    string |
    null;
}) {
  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const state =
          await transaction.project.findUnique({
            where: {
              id:
                projectId,
            },

            select: {
              name:
                true,

              industry:
                true,

              currency:
                true,

              startMonth:
                true,

              horizonMonths:
                true,

              revenueMode:
                true,

              baseAssumptions:
                true,

              scenarios:
                true,

              financingEvents:
                true,

              monthlyOverrides:
                true,
            },
          });


        if (
          !state
        ) {
          throw new Error(
            "Project not found.",
          );
        }


        const snapshot =
          snapshotFromProject(
            state,
          );


        const project =
          await transaction.project.update({
            where: {
              id:
                projectId,
            },

            data: {
              revisionSequence: {
                increment:
                  1,
              },
            },

            select: {
              revisionSequence:
                true,
            },
          });


        const revision =
          await transaction.projectRevision.create({
            data: {
              projectId,

              version:
                project.revisionSequence,

              label,

              reason,

              snapshot:
                snapshot as never,

              createdByUserId:
                actorUserId,
            },

            select: {
              id:
                true,

              version:
                true,
            },
          });


        return revision;
      },
    );


  logProjectVersionEvent(
    "project.revision.created",
    {
      actorUserId,

      projectId,

      version:
        result.version,

      revisionId:
        result.id,
    },
  );


  return result;
}


export async function restoreProjectRevision({
  projectId,
  revisionId,
  actorUserId,
  reason,
}: {
  projectId:
    string;

  revisionId:
    string;

  actorUserId:
    string;

  reason:
    string |
    null;
}) {
  const revision =
    await prisma.projectRevision.findFirst({
      where: {
        id:
          revisionId,

        projectId,
      },

      select: {
        id:
          true,

        version:
          true,

        snapshot:
          true,
      },
    });


  if (
    !revision
  ) {
    throw new Error(
      "Revision not found.",
    );
  }


  const snapshot =
    parseProjectRevisionSnapshot(
      revision.snapshot,
    );


  const scenarios =
    prepareRelationRows(
      snapshot.scenarios,
      projectId,
    );


  const financingEvents =
    prepareRelationRows(
      snapshot.financingEvents,
      projectId,
    );


  const monthlyOverrides =
    prepareRelationRows(
      snapshot.monthlyOverrides,
      projectId,
    );


  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        /*
         * Remove dependent overrides before scenarios because
         * scenario-specific overrides may reference scenario IDs.
         */
        await transaction.monthlyOverride.deleteMany({
          where: {
            projectId,
          },
        });


        await transaction.financingEvent.deleteMany({
          where: {
            projectId,
          },
        });


        await transaction.scenario.deleteMany({
          where: {
            projectId,
          },
        });


        const project =
          await transaction.project.update({
            where: {
              id:
                projectId,
            },

            data: {
              name:
                snapshot.project.name,

              industry:
                snapshot.project.industry,

              currency:
                snapshot.project.currency,

              startMonth:
                new Date(
                  snapshot.project.startMonth,
                ),

              horizonMonths:
                snapshot.project.horizonMonths,

              revenueMode:
                snapshot.project.revenueMode as never,

              baseAssumptions:
                snapshot.project.baseAssumptions as never,

              revisionSequence: {
                increment:
                  1,
              },
            },

            select: {
              revisionSequence:
                true,
            },
          });


        if (
          scenarios.length >
          0
        ) {
          await transaction.scenario.createMany({
            data:
              scenarios as never,
          });
        }


        if (
          financingEvents.length >
          0
        ) {
          await transaction.financingEvent.createMany({
            data:
              financingEvents as never,
          });
        }


        if (
          monthlyOverrides.length >
          0
        ) {
          await transaction.monthlyOverride.createMany({
            data:
              monthlyOverrides as never,
          });
        }


        /*
         * Restoring old state never modifies the historical source.
         * A new immutable revision is appended instead.
         */
        const restoredRevision =
          await transaction.projectRevision.create({
            data: {
              projectId,

              version:
                project.revisionSequence,

              label:
                `Restored from v${revision.version}`,

              reason,

              snapshot:
                snapshot as never,

              sourceRevisionId:
                revision.id,

              createdByUserId:
                actorUserId,
            },

            select: {
              id:
                true,

              version:
                true,
            },
          });


        return restoredRevision;
      },
    );


  logProjectVersionEvent(
    "project.revision.restored",
    {
      actorUserId,

      projectId,

      version:
        result.version,

      revisionId:
        result.id,

      sourceRevisionId:
        revision.id,
    },
  );


  return result;
}
