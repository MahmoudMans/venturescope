export type CapitalPlanningBasis =
  | "BASE"
  | "DOWNSIDE";


export type CapitalStrategyKind =
  | "EQUITY"
  | "DEBT"
  | "HYBRID";


export type CapitalCashPoint = {
  period:
    string;

  cashBalance:
    number;
};


export type AdjustedCapitalCashPoint = {
  period:
    string;

  sourceCashBalance:
    number;

  adjustedCashBalance:
    number;

  cumulativeDebtService:
    number;
};


export type CapitalPlanningInputs = {
  targetCashFloor:
    number;

  raisePeriodIndex:
    number;

  capitalAmount:
    number;

  preMoneyValuation:
    number;

  annualDebtRate:
    number;

  debtTermMonths:
    number;

  hybridEquityShare:
    number;
};


export type CapitalStrategyResult = {
  kind:
    CapitalStrategyKind;

  capitalAmount:
    number;

  equityAmount:
    number;

  debtAmount:
    number;

  dilution:
    number |
    null;

  monthlyDebtService:
    number;

  totalDebtInterest:
    number;

  minimumCash:
    number |
    null;

  endingCash:
    number |
    null;

  floorBreachPeriod:
    string |
    null;

  cashExhaustionPeriod:
    string |
    null;

  monthsBelowFloor:
    number;

  cashPath:
    AdjustedCapitalCashPoint[];
};


export type CapitalPlanningReport = {
  basis:
    CapitalPlanningBasis;

  targetCashFloor:
    number;

  raisePeriodIndex:
    number;

  raisePeriod:
    string |
    null;

  sourcePath:
    CapitalCashPoint[];

  sourceMinimumCash:
    number |
    null;

  sourceEndingCash:
    number |
    null;

  sourceCashExhaustionPeriod:
    string |
    null;

  requiredCapitalAfterRaise:
    number;

  preRaiseFloorBreachPeriod:
    string |
    null;

  strategies:
    CapitalStrategyResult[];
};
