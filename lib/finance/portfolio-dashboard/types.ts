import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import type {
  KpiTargetView,
  KpiScorecardSummary,
} from "@/lib/finance/scorecard/types";


export type PortfolioCloseStatus =
  | "OPEN"
  | "CLOSED"
  | "NO_ACTUALS";


export type PortfolioAttentionLevel =
  | "CRITICAL"
  | "REVIEW"
  | "MONITOR"
  | "STABLE";


export type PortfolioActionSource = {
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


export type PortfolioProjectSource = {
  id:
    string;

  name:
    string;

  industry:
    string;

  currency:
    string;

  role:
    string;

  isCurrentProject:
    boolean;

  actuals:
    ActualFinancialPeriod[];

  riskPolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  latestPeriodCloseStatus:
    PortfolioCloseStatus;

  targets:
    KpiTargetView[];

  actions:
    PortfolioActionSource[];
};


export type PortfolioProjectAnalytics = {
  project:
    PortfolioProjectSource;

  forecastAvailable:
    boolean;

  liveSnapshot:
    ExecutiveReviewSnapshot |
    null;

  scorecardSummary:
    KpiScorecardSummary |
    null;
};


export type PortfolioProjectRow = {
  id:
    string;

  name:
    string;

  industry:
    string;

  currency:
    string;

  role:
    string;

  isCurrentProject:
    boolean;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  latestPeriodCloseStatus:
    PortfolioCloseStatus;

  forecastAvailable:
    boolean;

  liquidityRiskLevel:
    string |
    null;

  liquidityRiskScore:
    number |
    null;

  capitalNeed:
    number |
    null;

  forecastAccuracy:
    number |
    null;

  openActions:
    number;

  criticalOpenActions:
    number;

  overdueActions:
    number;

  offTrackTargets:
    number;

  atRiskTargets:
    number;

  attentionScore:
    number;

  attentionLevel:
    PortfolioAttentionLevel;
};


export type PortfolioCurrencySummary = {
  currency:
    string;

  projectCount:
    number;

  projectsWithForecast:
    number;

  projectsWithActualCash:
    number;

  latestActualCash:
    number;

  capitalNeed:
    number;
};


export type PortfolioRiskDistribution = {
  critical:
    number;

  high:
    number;

  moderate:
    number;

  low:
    number;

  unavailable:
    number;
};


export type PortfolioExecutiveSummary = {
  loadedProjects:
    number;

  forecastReady:
    number;

  forecastUnavailable:
    number;

  criticalHighRisk:
    number;

  openCriticalActions:
    number;

  offTrackTargets:
    number;

  openFinancialPeriods:
    number;

  averageForecastAccuracy:
    number |
    null;

  riskDistribution:
    PortfolioRiskDistribution;
};


export type PortfolioExecutiveDashboard = {
  rows:
    PortfolioProjectRow[];

  currencies:
    PortfolioCurrencySummary[];

  summary:
    PortfolioExecutiveSummary;
};
