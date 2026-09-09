import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  ActivityCenter,
} from "@/components/activity/activity-center";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  parseProjectAuditCategory,
  parseProjectAuditSeverity,
} from "@/lib/audit/catalog";

import {
  parseProjectAuditMetadata,
} from "@/lib/audit/metadata";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Activity Center",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


function searchValue(
  value:
    string |
    string[] |
    undefined,
): string {
  return typeof value ===
    "string"
    ?
      value.trim()
    :
      "";
}


export default async function ActivityPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;

  searchParams:
    Promise<{
      category?:
        string |
        string[];

      severity?:
        string |
        string[];

      action?:
        string |
        string[];

      actor?:
        string |
        string[];

      q?:
        string |
        string[];
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    projectId,
  } =
    await params;


  const project =
    await getOwnedProject(
      user.id,
      projectId,
    );


  if (
    !project
  ) {
    notFound();
  }


  const raw =
    await searchParams;


  const categoryRaw =
    searchValue(
      raw.category,
    );


  const severityRaw =
    searchValue(
      raw.severity,
    );


  const action =
    searchValue(
      raw.action,
    )
      .toUpperCase()
      .slice(
        0,
        100,
      );


  const actor =
    searchValue(
      raw.actor,
    )
      .slice(
        0,
        100,
      );


  const query =
    searchValue(
      raw.q,
    )
      .slice(
        0,
        150,
      );


  const category =
    categoryRaw &&
    categoryRaw !==
      "ALL"
      ?
        parseProjectAuditCategory(
          categoryRaw,
        )
      :
        null;


  const severity =
    severityRaw &&
    severityRaw !==
      "ALL"
      ?
        parseProjectAuditSeverity(
          severityRaw,
        )
      :
        null;


  const where = {
    projectId,

    ...(category
      ?
        {
          category,
        }
      :
        {}),

    ...(severity
      ?
        {
          severity,
        }
      :
        {}),

    ...(action
      ?
        {
          action: {
            contains:
              action,

            mode:
              "insensitive" as const,
          },
        }
      :
        {}),

    ...(actor
      ?
        {
          actorUserId: {
            contains:
              actor,

            mode:
              "insensitive" as const,
          },
        }
      :
        {}),

    ...(query
      ?
        {
          OR: [
            {
              summary: {
                contains:
                  query,

                mode:
                  "insensitive" as const,
              },
            },

            {
              action: {
                contains:
                  query,

                mode:
                  "insensitive" as const,
              },
            },

            {
              entityType: {
                contains:
                  query,

                mode:
                  "insensitive" as const,
              },
            },

            {
              entityId: {
                contains:
                  query,

                mode:
                  "insensitive" as const,
              },
            },
          ],
        }
      :
        {}),
  };


  const [
    storedEvents,
    total,
    info,
    warning,
    critical,
  ] =
    await Promise.all([
      prisma.projectAuditEvent.findMany({
        where,

        orderBy: {
          createdAt:
            "desc",
        },

        take:
          250,
      }),

      prisma.projectAuditEvent.count({
        where: {
          projectId,
        },
      }),

      prisma.projectAuditEvent.count({
        where: {
          projectId,

          severity:
            "INFO",
        },
      }),

      prisma.projectAuditEvent.count({
        where: {
          projectId,

          severity:
            "WARNING",
        },
      }),

      prisma.projectAuditEvent.count({
        where: {
          projectId,

          severity:
            "CRITICAL",
        },
      }),
    ]);


  const actorIds =
    [
      ...new Set(
        storedEvents.flatMap(
          (
            event,
          ) =>
            event.actorUserId
              ?
                [
                  event.actorUserId,
                ]
              :
                [],
        ),
      ),
    ];


  const actors =
    actorIds.length >
      0
      ?
        await prisma.user.findMany({
          where: {
            id: {
              in:
                actorIds,
            },
          },

          select: {
            id:
              true,

            name:
              true,

            email:
              true,
          },
        })
      :
        [];


  const actorById =
    new Map(
      actors.map(
        (
          actorRecord,
        ) => [
          actorRecord.id,
          actorRecord.name ??
          actorRecord.email ??
          actorRecord.id,
        ],
      ),
    );


  const events =
    storedEvents.map(
      (
        event,
      ) => ({
        id:
          event.id,

        projectId:
          event.projectId,

        category:
          parseProjectAuditCategory(
            event.category,
          ),

        action:
          event.action,

        severity:
          parseProjectAuditSeverity(
            event.severity,
          ),

        actorUserId:
          event.actorUserId,

        actorLabel:
          event.actorUserId
            ?
              actorById.get(
                event.actorUserId,
              ) ??
              null
            :
              null,

        entityType:
          event.entityType,

        entityId:
          event.entityId,

        summary:
          event.summary,

        metadata:
          parseProjectAuditMetadata(
            event.metadata,
          ),

        createdAt:
          event.createdAt
            .toISOString(),
      }),
    );


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Governance &amp; accountability
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Activity Center
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Review the immutable project audit trail across financial close, management decisions, KPI targets, variance explanations, and executive reviews.
        </p>
      </header>

      <ActivityCenter
        projectId={
          projectId
        }
        events={
          events
        }
        summary={{
          total,

          info,

          warning,

          critical,
        }}
        filters={{
          category:
            category ??
            "ALL",

          severity:
            severity ??
            "ALL",

          action,

          actor,

          query,
        }}
      />
    </main>
  );
}
