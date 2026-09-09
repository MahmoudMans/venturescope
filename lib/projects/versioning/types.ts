export const PROJECT_REVISION_SCHEMA_VERSION =
  1;


export type ProjectRevisionProjectState = {
  name:
    string;

  industry:
    string |
    null;

  currency:
    string;

  startMonth:
    string;

  horizonMonths:
    number;

  revenueMode:
    string;

  baseAssumptions:
    unknown;
};


export type ProjectRevisionSnapshot = {
  schemaVersion:
    typeof PROJECT_REVISION_SCHEMA_VERSION;

  capturedAt:
    string;

  project:
    ProjectRevisionProjectState;

  scenarios:
    Record<
      string,
      unknown
    >[];

  financingEvents:
    Record<
      string,
      unknown
    >[];

  monthlyOverrides:
    Record<
      string,
      unknown
    >[];
};
