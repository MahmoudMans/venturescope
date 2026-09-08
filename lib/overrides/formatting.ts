import type {
  MonthlyOverrideValues,
} from "@/lib/finance/types";

const FIELD_LABELS: Record<
  keyof MonthlyOverrideValues,
  string
> = {
  revenue:
    "Revenue",

  marketing:
    "Marketing",

  salaries:
    "Salaries",

  rent:
    "Rent",

  cogs:
    "COGS",

  cac:
    "CAC",

  churnRate:
    "Churn",

  arpu:
    "ARPU",
};

export function monthlyOverrideFieldLabels(
  values: MonthlyOverrideValues,
): string[] {
  return Object.keys(
    values,
  )
    .filter(
      (
        field,
      ): field is keyof MonthlyOverrideValues =>
        field in
        FIELD_LABELS,
    )
    .map(
      (
        field,
      ) =>
        FIELD_LABELS[
          field
        ],
    );
}

export function monthlyOverrideScopeLabel(
  scenarioName:
    | string
    | null,
): string {
  return scenarioName ??
    "All scenarios";
}
