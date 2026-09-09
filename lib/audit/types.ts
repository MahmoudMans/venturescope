export const PROJECT_AUDIT_CATEGORIES = [
  "DECISION_CENTER",
  "BOARD_ROOM",
  "SCORECARD",
  "VARIANCE_REVIEW",
  "FINANCIAL_CLOSE",
  "MODEL_GOVERNANCE",
  "COLLABORATION",
  "SECURITY",
  "PROJECT",
  "OTHER",
] as const;


export type ProjectAuditCategory =
  typeof PROJECT_AUDIT_CATEGORIES[
    number
  ];


export const PROJECT_AUDIT_SEVERITIES = [
  "INFO",
  "WARNING",
  "CRITICAL",
] as const;


export type ProjectAuditSeverity =
  typeof PROJECT_AUDIT_SEVERITIES[
    number
  ];


export type ProjectAuditMetadata =
  Record<
    string,
    string |
    number |
    boolean |
    null
  >;


export type ProjectAuditEventView = {
  id:
    string;

  projectId:
    string;

  category:
    ProjectAuditCategory;

  action:
    string;

  severity:
    ProjectAuditSeverity;

  actorUserId:
    string |
    null;

  actorLabel:
    string |
    null;

  entityType:
    string |
    null;

  entityId:
    string |
    null;

  summary:
    string;

  metadata:
    ProjectAuditMetadata |
    null;

  createdAt:
    string;
};


export type ProjectActivitySummary = {
  total:
    number;

  info:
    number;

  warning:
    number;

  critical:
    number;
};
