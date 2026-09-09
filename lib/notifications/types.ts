import type {
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";

import type {
  ManagementScorecard,
} from "@/lib/finance/scorecard/types";

import type {
  VarianceReview,
} from "@/lib/finance/variance-review/types";

import type {
  FinancialPeriodRegister,
} from "@/lib/finance/period-close/types";


export const PROJECT_ALERT_CATEGORIES = [
  "LIQUIDITY",
  "CAPITAL",
  "ACTION",
  "KPI",
  "VARIANCE",
  "FORECAST",
  "FINANCIAL_CLOSE",
  "GOVERNANCE",
] as const;


export type ProjectAlertCategory =
  typeof PROJECT_ALERT_CATEGORIES[
    number
  ];


export type ProjectAlertSeverity =
  | "CRITICAL"
  | "WARNING"
  | "INFO";


export type ProjectAlert = {
  key:
    string;

  fingerprint:
    string;

  category:
    ProjectAlertCategory;

  severity:
    ProjectAlertSeverity;

  title:
    string;

  detail:
    string;

  sourceHref:
    string;

  sourceLabel:
    string;

  createdAt:
    string |
    null;
};


export type AlertDecisionAction = {
  id:
    string;

  title:
    string;

  priority:
    string;

  status:
    string;

  ownerName:
    string |
    null;

  dueDate:
    string |
    null;
};


export type AlertAuditEvent = {
  id:
    string;

  action:
    string;

  severity:
    "WARNING" |
    "CRITICAL";

  summary:
    string;

  createdAt:
    string;
};


export type ProjectAlertReceiptView = {
  id:
    string;

  alertKey:
    string;

  fingerprint:
    string;

  readAt:
    string |
    null;

  dismissedAt:
    string |
    null;

  snoozedUntil:
    string |
    null;

  updatedAt:
    string;
};


export type ProjectAlertInput = {
  projectId:
    string;

  latestActualPeriod:
    string |
    null;

  liveSnapshot:
    ExecutiveReviewSnapshot;

  scorecard:
    ManagementScorecard;

  varianceReview:
    VarianceReview;

  periodRegister:
    FinancialPeriodRegister;

  actions:
    AlertDecisionAction[];

  auditEvents:
    AlertAuditEvent[];
};


export type ResolvedProjectAlert = {
  alert:
    ProjectAlert;

  read:
    boolean;

  dismissed:
    boolean;

  snoozed:
    boolean;

  changedSinceReceipt:
    boolean;

  receipt:
    ProjectAlertReceiptView |
    null;
};


export type ProjectAlertInbox = {
  visible:
    ResolvedProjectAlert[];

  dismissed:
    ResolvedProjectAlert[];

  snoozed:
    ResolvedProjectAlert[];

  summary: {
    total:
      number;

    visible:
      number;

    unread:
      number;

    critical:
      number;

    warning:
      number;

    dismissed:
      number;

    snoozed:
      number;
  };
};
