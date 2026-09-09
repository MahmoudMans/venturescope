export type SensitivityCellState =
  | "RESILIENT"
  | "FLOOR_BREACH"
  | "CASH_EXHAUSTION";


export type SensitivityCell = {
  revenueShock:
    number;

  costInflation:
    number;

  minimumCash:
    number |
    null;

  endingCash:
    number |
    null;

  cashExhaustionPeriod:
    string |
    null;

  capitalNeed:
    number;

  state:
    SensitivityCellState;
};


export type SensitivityBoundaryPoint = {
  revenueShock:
    number;

  maximumCostInflationWithoutFunding:
    number |
    null;
};


export type SensitivitySurfaceSummary = {
  totalCells:
    number;

  resilientCells:
    number;

  floorBreachCells:
    number;

  cashExhaustionCells:
    number;

  worstMinimumCash:
    number |
    null;

  maximumCapitalNeed:
    number;

  earliestCashExhaustionPeriod:
    string |
    null;
};


export type SensitivitySurface = {
  revenueShocks:
    number[];

  costInflations:
    number[];

  targetCashFloor:
    number;

  cells:
    SensitivityCell[];

  boundary:
    SensitivityBoundaryPoint[];

  summary:
    SensitivitySurfaceSummary;
};
