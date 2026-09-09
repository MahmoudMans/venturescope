import {
  PROJECT_AUDIT_CATEGORIES,
  PROJECT_AUDIT_SEVERITIES,
  type ProjectAuditCategory,
  type ProjectAuditSeverity,
} from "@/lib/audit/types";


export const PROJECT_AUDIT_CATEGORY_LABELS:
  Record<
    ProjectAuditCategory,
    string
  > = {
    DECISION_CENTER:
      "Decision Center",

    BOARD_ROOM:
      "Board Room",

    SCORECARD:
      "Scorecard",

    VARIANCE_REVIEW:
      "Variance Review",

    FINANCIAL_CLOSE:
      "Financial Close",

    MODEL_GOVERNANCE:
      "Model Governance",

    COLLABORATION:
      "Collaboration",

    SECURITY:
      "Security",

    PROJECT:
      "Project",

    OTHER:
      "Other",
  };


export function parseProjectAuditCategory(
  value:
    string,
): ProjectAuditCategory {
  if (
    PROJECT_AUDIT_CATEGORIES.includes(
      value as
        ProjectAuditCategory,
    )
  ) {
    return value as
      ProjectAuditCategory;
  }


  throw new Error(
    "Invalid project audit category.",
  );
}


export function parseProjectAuditSeverity(
  value:
    string,
): ProjectAuditSeverity {
  if (
    PROJECT_AUDIT_SEVERITIES.includes(
      value as
        ProjectAuditSeverity,
    )
  ) {
    return value as
      ProjectAuditSeverity;
  }


  throw new Error(
    "Invalid project audit severity.",
  );
}


export function sanitizeAuditAction(
  value:
    string,
): string {
  const normalized =
    value
      .trim()
      .toUpperCase();


  if (
    !/^[A-Z0-9_]{3,100}$/u.test(
      normalized,
    )
  ) {
    throw new Error(
      "Audit action must contain only uppercase letters, digits, and underscores.",
    );
  }


  return normalized;
}
