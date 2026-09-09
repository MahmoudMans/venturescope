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
    await prisma.decisionAction.create({
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
    await prisma.decisionAction.updateMany({
      where: {
        id:
          actionId,

        projectId,
      },

      data: {
        status,
      },
    });


  if (
    result.count !==
    1
  ) {
    throw new Error(
      "Management action was not found in this project.",
    );
  }


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


  return {
    id:
      actionId,

    status,
  };
}
