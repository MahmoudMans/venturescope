import {
  DECISION_ACTION_PRIORITIES,
  DECISION_ACTION_STATUSES,
  DECISION_SOURCE_CODES,
  type DecisionActionPriority,
  type DecisionActionStatus,
  type DecisionSourceCode,
} from "@/lib/finance/decision-center/types";


export function parseDecisionPriority(
  value:
    string,
): DecisionActionPriority {
  if (
    DECISION_ACTION_PRIORITIES.includes(
      value as
        DecisionActionPriority,
    )
  ) {
    return value as
      DecisionActionPriority;
  }


  throw new Error(
    "Invalid management-action priority.",
  );
}


export function parseDecisionStatus(
  value:
    string,
): DecisionActionStatus {
  if (
    DECISION_ACTION_STATUSES.includes(
      value as
        DecisionActionStatus,
    )
  ) {
    return value as
      DecisionActionStatus;
  }


  throw new Error(
    "Invalid management-action status.",
  );
}


export function parseDecisionSourceCode(
  value:
    string,
): DecisionSourceCode {
  if (
    DECISION_SOURCE_CODES.includes(
      value as
        DecisionSourceCode,
    )
  ) {
    return value as
      DecisionSourceCode;
  }


  throw new Error(
    "Invalid management-action source.",
  );
}


export function parseDecisionDueDate(
  value:
    string,
): Date |
  null {
  const trimmed =
    value.trim();


  if (
    !trimmed
  ) {
    return null;
  }


  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(
      trimmed,
    )
  ) {
    throw new Error(
      "Due date must use YYYY-MM-DD.",
    );
  }


  const parsed =
    new Date(
      `${trimmed}T00:00:00.000Z`,
    );


  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    throw new Error(
      "Due date is invalid.",
    );
  }


  return parsed;
}
