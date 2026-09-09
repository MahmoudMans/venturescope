export const FINANCIAL_PERIOD_STATUSES = [
  "OPEN",
  "CLOSED",
] as const;


export type FinancialPeriodStatus =
  typeof FINANCIAL_PERIOD_STATUSES[
    number
  ];


export const FINANCIAL_PERIOD_EVENT_ACTIONS = [
  "CLOSED",
  "REOPENED",
] as const;


export type FinancialPeriodEventAction =
  typeof FINANCIAL_PERIOD_EVENT_ACTIONS[
    number
  ];


export type FinancialPeriodStateView = {
  id:
    string;

  periodKey:
    string;

  status:
    FinancialPeriodStatus;

  closeSequence:
    number;

  closedAt:
    string |
    null;

  closedByUserId:
    string |
    null;

  reopenedAt:
    string |
    null;

  reopenedByUserId:
    string |
    null;
};


export type FinancialPeriodEventView = {
  id:
    string;

  periodKey:
    string;

  action:
    FinancialPeriodEventAction;

  actorUserId:
    string;

  reason:
    string |
    null;

  sequence:
    number;

  createdAt:
    string;
};


export type FinancialPeriodActualView = {
  periodKey:
    string;

  revenue:
    number |
    null;

  ebitda:
    number |
    null;

  cashBalance:
    number |
    null;
};


export type FinancialPeriodRegisterRow = {
  periodKey:
    string;

  status:
    FinancialPeriodStatus;

  closeSequence:
    number;

  closedAt:
    string |
    null;

  closedByUserId:
    string |
    null;

  reopenedAt:
    string |
    null;

  reopenedByUserId:
    string |
    null;

  revenue:
    number |
    null;

  ebitda:
    number |
    null;

  cashBalance:
    number |
    null;
};


export type FinancialPeriodRegisterSummary = {
  totalPeriods:
    number;

  openPeriods:
    number;

  closedPeriods:
    number;

  closeCycles:
    number;
};


export type FinancialPeriodRegister = {
  rows:
    FinancialPeriodRegisterRow[];

  summary:
    FinancialPeriodRegisterSummary;
};
