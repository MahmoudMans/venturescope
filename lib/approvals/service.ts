import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";

import {
  approvalStatusFromDecision,
  assertApprovalPending,
  parseApprovalRequestStatus,
} from "@/lib/approvals/validation";

import type {
  ApprovalDecision,
  ApprovalRequestType,
} from "@/lib/approvals/types";


const MAX_APPROVAL_REQUESTS_PER_PROJECT =
  500;


const MAX_PENDING_REQUESTS_PER_PROJECT =
  100;


export async function createApprovalRequest({
  projectId,
  actorUserId,
  requestType,
  subjectType,
  subjectId,
  title,
  description,
}: {
  projectId:
    string;

  actorUserId:
    string;

  requestType:
    ApprovalRequestType;

  subjectType:
    string |
    null;

  subjectId:
    string |
    null;

  title:
    string;

  description:
    string |
    null;
}) {
  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const [
          total,
          pending,
        ] =
          await Promise.all([
            transaction.approvalRequest.count({
              where: {
                projectId,
              },
            }),

            transaction.approvalRequest.count({
              where: {
                projectId,

                status:
                  "PENDING",
              },
            }),
          ]);


        if (
          total >=
          MAX_APPROVAL_REQUESTS_PER_PROJECT
        ) {
          throw new Error(
            `A project may contain at most ${MAX_APPROVAL_REQUESTS_PER_PROJECT} approval requests.`,
          );
        }


        if (
          pending >=
          MAX_PENDING_REQUESTS_PER_PROJECT
        ) {
          throw new Error(
            `A project may contain at most ${MAX_PENDING_REQUESTS_PER_PROJECT} pending approval requests.`,
          );
        }


        const created =
          await transaction.approvalRequest.create({
            data: {
              projectId,

              requestType,

              subjectType,

              subjectId,

              title,

              description,

              requestedByUserId:
                actorUserId,
            },

            select: {
              id:
                true,

              title:
                true,

              requestType:
                true,

              status:
                true,

              requestedAt:
                true,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "PROJECT",

            action:
              "APPROVAL_REQUEST_CREATED",

            severity:
              "INFO",

            actorUserId,

            entityType:
              "ApprovalRequest",

            entityId:
              created.id,

            summary:
              `Approval requested: ${created.title}`,

            metadata: {
              requestType,

              status:
                created.status,

              subjectType,

              subjectId,
            },
          },
        });


        return created;
      },
    );


  logStructured(
    "info",
    "project.approval-request.created",
    {
      projectId,

      actorUserId,

      approvalRequestId:
        result.id,

      requestType:
        result.requestType,
    },
  );


  return result;
}


export async function decideApprovalRequest({
  projectId,
  requestId,
  actorUserId,
  decision,
  decisionNote,
}: {
  projectId:
    string;

  requestId:
    string;

  actorUserId:
    string;

  decision:
    ApprovalDecision;

  decisionNote:
    string;
}) {
  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const existing =
          await transaction.approvalRequest.findFirst({
            where: {
              id:
                requestId,

              projectId,
            },
          });


        if (
          !existing
        ) {
          throw new Error(
            "Approval request was not found in this project.",
          );
        }


        const currentStatus =
          parseApprovalRequestStatus(
            existing.status,
          );


        assertApprovalPending(
          currentStatus,
        );


        if (
          existing.requestedByUserId ===
          actorUserId
        ) {
          throw new Error(
            "Requester and approver must be different users.",
          );
        }


        const status =
          approvalStatusFromDecision(
            decision,
          );


        const now =
          new Date();


        const updated =
          await transaction.approvalRequest.update({
            where: {
              id:
                existing.id,
            },

            data: {
              status,

              decidedByUserId:
                actorUserId,

              decidedAt:
                now,

              decisionNote,

              cancelledAt:
                null,
            },

            select: {
              id:
                true,

              title:
                true,

              requestType:
                true,

              status:
                true,

              decidedAt:
                true,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "PROJECT",

            action:
              status ===
                "APPROVED"
                ?
                  "APPROVAL_REQUEST_APPROVED"
                :
                  "APPROVAL_REQUEST_REJECTED",

            severity:
              status ===
                "REJECTED"
                ?
                  "WARNING"
                :
                  "INFO",

            actorUserId,

            entityType:
              "ApprovalRequest",

            entityId:
              updated.id,

            summary:
              `${status === "APPROVED" ? "Approval granted" : "Approval rejected"}: ${updated.title}`,

            metadata: {
              requestType:
                updated.requestType,

              previousStatus:
                currentStatus,

              status,

              decisionNote,
            },
          },
        });


        return updated;
      },
    );


  logStructured(
    "info",
    "project.approval-request.decided",
    {
      projectId,

      actorUserId,

      approvalRequestId:
        result.id,

      status:
        result.status,
    },
  );


  return result;
}


export async function cancelApprovalRequest({
  projectId,
  requestId,
  actorUserId,
}: {
  projectId:
    string;

  requestId:
    string;

  actorUserId:
    string;
}) {
  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const existing =
          await transaction.approvalRequest.findFirst({
            where: {
              id:
                requestId,

              projectId,
            },
          });


        if (
          !existing
        ) {
          throw new Error(
            "Approval request was not found in this project.",
          );
        }


        const currentStatus =
          parseApprovalRequestStatus(
            existing.status,
          );


        assertApprovalPending(
          currentStatus,
        );


        if (
          existing.requestedByUserId !==
          actorUserId
        ) {
          throw new Error(
            "Only the requester may cancel a pending approval request.",
          );
        }


        const now =
          new Date();


        const updated =
          await transaction.approvalRequest.update({
            where: {
              id:
                existing.id,
            },

            data: {
              status:
                "CANCELLED",

              cancelledAt:
                now,

              decidedAt:
                null,

              decidedByUserId:
                null,

              decisionNote:
                null,
            },

            select: {
              id:
                true,

              title:
                true,

              requestType:
                true,

              status:
                true,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "PROJECT",

            action:
              "APPROVAL_REQUEST_CANCELLED",

            severity:
              "INFO",

            actorUserId,

            entityType:
              "ApprovalRequest",

            entityId:
              updated.id,

            summary:
              `Approval request cancelled: ${updated.title}`,

            metadata: {
              requestType:
                updated.requestType,

              previousStatus:
                currentStatus,

              status:
                "CANCELLED",
            },
          },
        });


        return updated;
      },
    );


  logStructured(
    "info",
    "project.approval-request.cancelled",
    {
      projectId,

      actorUserId,

      approvalRequestId:
        result.id,
    },
  );


  return result;
}
