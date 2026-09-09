import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";

import type {
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";


const MAX_REVIEWS_PER_PROJECT =
  48;


export async function createExecutiveReview({
  projectId,
  actorUserId,
  periodKey,
  title,
  commentary,
  modelVersion,
  snapshot,
}: {
  projectId:
    string;

  actorUserId:
    string;

  periodKey:
    string;

  title:
    string;

  commentary:
    string |
    null;

  modelVersion:
    string;

  snapshot:
    ExecutiveReviewSnapshot;
}) {
  const review =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const count =
          await transaction.executiveReview.count({
            where: {
              projectId,
            },
          });


        if (
          count >=
          MAX_REVIEWS_PER_PROJECT
        ) {
          throw new Error(
            `A project may contain at most ${MAX_REVIEWS_PER_PROJECT} frozen executive reviews.`,
          );
        }


        const created =
          await transaction.executiveReview.create({
            data: {
              projectId,

              periodKey,

              title,

              commentary,

              modelVersion,

              snapshot:
                snapshot as never,

              createdByUserId:
                actorUserId,
            },

            select: {
              id:
                true,

              periodKey:
                true,

              title:
                true,

              createdAt:
                true,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "BOARD_ROOM",

            action:
              "EXECUTIVE_REVIEW_FROZEN",

            severity:
              "INFO",

            actorUserId,

            entityType:
              "ExecutiveReview",

            entityId:
              created.id,

            summary:
              `Executive review frozen: ${created.title}`,

            metadata: {
              periodKey,

              modelVersion,

              criticalSignals:
                snapshot.signals.filter(
                  (
                    signal,
                  ) =>
                    signal.severity ===
                    "CRITICAL",
                ).length,

              openActions:
                snapshot.actions.open,
            },
          },
        });


        return created;
      },
    );


  logStructured(
    "info",
    "project.executive-review.created",
    {
      projectId,

      actorUserId,

      executiveReviewId:
        review.id,

      periodKey:
        review.periodKey,
    },
  );


  return review;
}
