export const PROJECT_CURRENCY_VALUES = [
  "EUR",
  "USD",
  "GBP",
  "TND",
  "CAD",
  "AED",
  "CHF",
] as const;

export type ProjectCurrency =
  (typeof PROJECT_CURRENCY_VALUES)[number];

export const PROJECT_CURRENCIES = [
  {
    value: "EUR",
    label: "Euro",
    symbol: "€",
  },
  {
    value: "USD",
    label: "US Dollar",
    symbol: "$",
  },
  {
    value: "GBP",
    label: "British Pound",
    symbol: "£",
  },
  {
    value: "TND",
    label: "Tunisian Dinar",
    symbol: "TND",
  },
  {
    value: "CAD",
    label: "Canadian Dollar",
    symbol: "CA$",
  },
  {
    value: "AED",
    label: "UAE Dirham",
    symbol: "AED",
  },
  {
    value: "CHF",
    label: "Swiss Franc",
    symbol: "CHF",
  },
] as const;

export const PROJECT_HORIZONS = [
  12,
  24,
  36,
  48,
  60,
] as const;

export type ProjectHorizon =
  (typeof PROJECT_HORIZONS)[number];

export const REVENUE_MODE_VALUES = [
  "DIRECT",
  "CUSTOMER_DRIVEN",
] as const;

export type RevenueModeValue =
  (typeof REVENUE_MODE_VALUES)[number];

export const REVENUE_MODE_OPTIONS = [
  {
    value: "DIRECT",
    title: "Direct revenue",
    description:
      "Forecast revenue directly from starting monthly revenue and growth assumptions.",
  },
  {
    value: "CUSTOMER_DRIVEN",
    title: "Customer-driven",
    description:
      "Forecast revenue from customers, acquisition, churn, CAC and ARPU.",
  },
] as const;
