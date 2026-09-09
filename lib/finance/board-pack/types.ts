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


export type BoardPackInsightSeverity =
  | "CRITICAL"
  | "WARNING"
  | "INFO";


export type BoardPackInsight = {
  code:
    string;

  severity:
    BoardPackInsightSeverity;

  title:
    string;

  detail:
    string;

  managementResponse:
    string;
};


export type BoardPackActionView = {
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

  sourceCode:
    string |
    null;
};


export type BoardPackAuditSummary = {
  total:
    number;

  warning:
    number;

  critical:
    number;
};


export type BoardPackLatestReview = {
  id:
    string;

  periodKey:
    string;

  title:
    string;

  modelVersion:
    string;

  createdAt:
    string;

  createdBy:
    string |
    null;

  snapshot:
    ExecutiveReviewSnapshot;
};


export type BoardPackIntelligenceInput = {
  reportPeriod:
    string;

  liveSnapshot:
    ExecutiveReviewSnapshot;

  scorecard:
    ManagementScorecard;

  varianceReview:
    VarianceReview;

  periodRegister:
    FinancialPeriodRegister;

  actions:
    BoardPackActionView[];
};


export type BoardPackExecutiveSummary = {
  insights:
    BoardPackInsight[];

  critical:
    number;

  warnings:
    number;
};
