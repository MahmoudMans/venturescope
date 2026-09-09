export type JsonPrimitive =
  string |
  number |
  boolean |
  null;


export type JsonValue =
  JsonPrimitive |
  JsonValue[] |
  {
    [
      key:
        string
    ]:
      JsonValue;
  };


export type RevisionDiffView = {
  id:
    string;

  version:
    number;

  label:
    string |
    null;

  reason:
    string |
    null;

  sourceRevisionId:
    string |
    null;

  createdAt:
    string;

  snapshot:
    JsonValue;
};


export type ModelChangeKind =
  | "ADDED"
  | "REMOVED"
  | "CHANGED"
  | "TYPE_CHANGED";


export type ModelChangeCategory =
  | "PROJECT"
  | "ASSUMPTIONS"
  | "SCENARIOS"
  | "FINANCING"
  | "OVERRIDES"
  | "OTHER";


export type ModelChangeMateriality =
  | "HIGH"
  | "MEDIUM"
  | "LOW";


export type ModelChange = {
  path:
    string;

  kind:
    ModelChangeKind;

  category:
    ModelChangeCategory;

  materiality:
    ModelChangeMateriality;

  before:
    JsonValue |
    null;

  after:
    JsonValue |
    null;
};


export type ModelDiffSummary = {
  total:
    number;

  high:
    number;

  medium:
    number;

  low:
    number;

  added:
    number;

  removed:
    number;

  changed:
    number;

  typeChanged:
    number;

  assumptions:
    number;

  scenarios:
    number;

  financing:
    number;

  overrides:
    number;

  project:
    number;

  other:
    number;
};


export type ModelVersionDiff = {
  fromVersion:
    number;

  toVersion:
    number;

  changes:
    ModelChange[];

  summary:
    ModelDiffSummary;
};
