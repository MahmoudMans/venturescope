import type {
  JsonValue,
  ModelChange,
} from "@/lib/projects/version-diff/types";


export type ScenarioComparisonView = {
  id:
    string;

  name:
    string;

  isBase:
    boolean;

  snapshot:
    JsonValue;
};


export type ScenarioNumericDirection =
  | "INCREASED"
  | "DECREASED";


export type ScenarioNumericChange = {
  path:
    string;

  before:
    number;

  after:
    number;

  delta:
    number;

  relativeRate:
    number |
    null;

  direction:
    ScenarioNumericDirection;
};


export type ScenarioDivergence =
  | "IDENTICAL"
  | "LOW"
  | "MODERATE"
  | "HIGH";


export type ScenarioComparisonSummary = {
  totalChanges:
    number;

  added:
    number;

  removed:
    number;

  changed:
    number;

  typeChanged:
    number;

  numericIncreases:
    number;

  numericDecreases:
    number;

  structuralChanges:
    number;

  divergence:
    ScenarioDivergence;
};


export type ScenarioComparisonResult = {
  reference:
    ScenarioComparisonView;

  target:
    ScenarioComparisonView;

  changes:
    ModelChange[];

  numericChanges:
    ScenarioNumericChange[];

  summary:
    ScenarioComparisonSummary;
};


export type ScenarioDecisionMatrixRow = {
  scenarioId:
    string;

  scenarioName:
    string;

  isReference:
    boolean;

  isBase:
    boolean;

  totalChanges:
    number;

  added:
    number;

  removed:
    number;

  changed:
    number;

  typeChanged:
    number;

  numericIncreases:
    number;

  numericDecreases:
    number;

  structuralChanges:
    number;

  divergence:
    ScenarioDivergence;
};
