export const APPROVAL_REQUEST_TYPES = [
  "MODEL_CHANGE",
  "RISK_POLICY_CHANGE",
  "FINANCIAL_PERIOD_REOPEN",
  "EXECUTIVE_REVIEW",
  "KPI_TARGET_CHANGE",
  "CAPITAL_PLAN",
  "DATA_IMPORT",
  "OTHER",
] as const;


export type ApprovalRequestType =
  typeof APPROVAL_REQUEST_TYPES[
    number
  ];


export const APPROVAL_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;


export type ApprovalRequestStatus =
  typeof APPROVAL_REQUEST_STATUSES[
    number
  ];


export const APPROVAL_DECISIONS = [
  "APPROVE",
  "REJECT",
] as const;


export type ApprovalDecision =
  typeof APPROVAL_DECISIONS[
    number
  ];


export type ApprovalRequestView = {
  id:
    string;

  projectId:
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

  status:
    ApprovalRequestStatus;

  requestedByUserId:
    string |
    null;

  requesterLabel:
    string |
    null;

  requestedAt:
    string;

  decidedByUserId:
    string |
    null;

  deciderLabel:
    string |
    null;

  decidedAt:
    string |
    null;

  decisionNote:
    string |
    null;

  cancelledAt:
    string |
    null;
};


export type ApprovalSummary = {
  total:
    number;

  pending:
    number;

  approved:
    number;

  rejected:
    number;

  cancelled:
    number;
};
