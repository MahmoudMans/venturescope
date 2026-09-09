import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";

import type {
  DecisionActionPriority,
  DecisionActionStatus,
  DecisionSourceCode,
} from "@/lib/finance/decision-center/types";


export async function createDecisionAction({
  projectId,
  actorUserId,
  title,
  details,
  sourceCode,
  priority,
  ownerName,
  dueDate,
}: {
  projectId:
    string;

  actorUserId:
    string;

  title:
    string;

  details:
    string |
    null;

  sourceCode:
    DecisionSourceCode;

  priority:
    DecisionActionPriority;

  ownerName:
    string |
    null;

  dueDate:
    Date |
    null;
}) {
  const action =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const created =
          await transaction.decisionAction.create({
            data: {
              projectId,

              title,

              details,

              sourceCode,

              priority,

              ownerName,

              dueDate,

              createdByUserId:
                actorUserId,
            },

            select: {
              id:
                true,

              title:
                true,

              priority:
                true,

              status:
                true,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "DECISION_CENTER",

            action:
              "DECISION_ACTION_CREATED",

            severity:
              priority ===
                "CRITICAL"
                ?
                  "CRITICAL"
                :
              priority ===
                "HIGH"
                ?
                  "WARNING"
                :
                  "INFO",

            actorUserId,

            entityType:
              "DecisionAction",

            entityId:
              created.id,

            summary:
              `Management action created: ${created.title}`,

            metadata: {
              priority:
                created.priority,

              status:
                created.status,

              sourceCode,
            },
          },
        });


        return created;
      },
    );


  logStructured(
    "info",
    "project.decision-action.created",
    {
      projectId,

      actorUserId,

      decisionActionId:
        action.id,

      priority:
        action.priority,

      status:
        action.status,
    },
  );


  return action;
}


export async function updateDecisionActionStatus({
  projectId,
  actionId,
  actorUserId,
  status,
}: {
  projectId:
    string;

  actionId:
    string;

  actorUserId:
    string;

  status:
    DecisionActionStatus;
}) {
  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const existing =
          await transaction.decisionAction.findFirst({
            where: {
              id:
                actionId,

              projectId,
            },

            select: {
              id:
                true,

              title:
                true,

              status:
                true,
            },
          });


        if (
          !existing
        ) {
          throw new Error(
            "Management action was not found in this project.",
          );
        }


        const updated =
          await transaction.decisionAction.update({
            where: {
              id:
                existing.id,
            },

            data: {
              status,
            },

            select: {
              id:
                true,

              status:
                true,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "DECISION_CENTER",

            action:
              "DECISION_ACTION_STATUS_CHANGED",

            severity:
              status ===
                "BLOCKED"
                ?
                  "WARNING"
                :
                  "INFO",

            actorUserId,

            entityType:
              "DecisionAction",

            entityId:
              existing.id,

            summary:
              `Management action status changed: ${existing.title}`,

            metadata: {
              previousStatus:
                existing.status,

              status,
            },
          },
        });


        return updated;
      },
    );


  logStructured(
    "info",
    "project.decision-action.status-changed",
    {
      projectId,

      actorUserId,

      decisionActionId:
        actionId,

      status,
    },
  );


  return result;
}
