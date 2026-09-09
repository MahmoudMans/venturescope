import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


export const VENTURESCOPE_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "TND",
  "CAD",
  "AED",
  "CHF",
] as const;


export type VentureScopeCurrency =
  typeof VENTURESCOPE_CURRENCIES[
    number
  ];


export type WorkspaceFxRateView = {
  id:
    string;

  baseCurrency:
    VentureScopeCurrency;

  quoteCurrency:
    VentureScopeCurrency;

  rate:
    number;

  effectiveDate:
    string;

  sourceLabel:
    string;

  createdBy:
    string |
    null;

  createdAt:
    string;
};


export type ResolvedFxRate = {
  sourceCurrency:
    VentureScopeCurrency;

  reportingCurrency:
    VentureScopeCurrency;

  rate:
    number;

  effectiveDate:
    string |
    null;

  sourceLabel:
    string;

  direction:
    "IDENTITY" |
    "DIRECT" |
    "INVERSE" |
    "ZERO";
};


export type ConsolidationProjectSource = {
  id:
    string;

  name:
    string;

  industry:
    string;

  currency:
    VentureScopeCurrency;

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

  actions:
    {
      status:
        string;

      priority:
        string;

      dueDate:
        string |
        null;
    }[];
};


export type ConsolidationProjectResult = {
  projectId:
    string;

  name:
    string;

  industry:
    string;

  sourceCurrency:
    VentureScopeCurrency;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  capitalNeed:
    number |
    null;

  forecastAvailable:
    boolean;

  resolvedFx:
    ResolvedFxRate |
    null;

  consolidatedCash:
    number |
    null;

  consolidatedCapitalNeed:
    number |
    null;
};


export type ConsolidatedPortfolioReport = {
  reportingCurrency:
    VentureScopeCurrency;

  asOfDate:
    string;

  rows:
    ConsolidationProjectResult[];

  totalCash:
    number;

  totalCapitalNeed:
    number;

  projects:
    number;

  forecastReady:
    number;

  missingCashRates:
    number;

  missingCapitalRates:
    number;

  complete:
    boolean;
};
