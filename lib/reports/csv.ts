import type {
  ReadyReportContext,
} from "@/lib/reports/context";

function csvCell(
  value:
    | string
    | number
    | null
    | undefined,
): string {
  const normalized =
    value ===
      null ||
    value ===
      undefined
      ? ""
      : String(
          value,
        );

  if (
    normalized.includes(
      ",",
    ) ||
    normalized.includes(
      "\"",
    ) ||
    normalized.includes(
      "\n",
    ) ||
    normalized.includes(
      "\r",
    )
  ) {
    return `"${normalized.replace(
      /"/g,
      "\"\"",
    )}"`;
  }

  return normalized;
}

export function buildForecastCsv(
  context: ReadyReportContext,
): string {
  const {
    forecast,
  } = context;

  const headers = [
    "project_id",
    "project_name",
    "scenario",
    "scenario_type",
    "currency",
    "month",
    "year",
    "month_number",

    "opening_customers",
    "paid_new_customers",
    "organic_new_customers",
    "new_customers",
    "churned_customers",
    "ending_customers",
    "arpu",

    "mrr",
    "recurring_revenue",
    "non_recurring_revenue",
    "one_time_revenue",
    "revenue",

    "cogs",
    "gross_profit",
    "gross_margin_percentage",

    "salaries",
    "rent",
    "marketing",

    "software",
    "professional_services",
    "insurance",
    "utilities",
    "travel",
    "other_operating_expense",
    "custom_operating_expense",

    "other_operating_expenses",
    "total_operating_expenses",

    "ebitda",
    "ebitda_margin_percentage",

    "interest_expense",
    "profit_before_tax",
    "tax",
    "net_income",
    "net_margin_percentage",

    "operating_cash_inflow",
    "operating_cash_outflow",
    "operating_cash_flow",

    "equity_financing",
    "debt_financing",
    "grant_financing",
    "other_financing",
    "total_financing",

    "debt_principal_repayment",

    "opening_cash",
    "net_cash_movement",
    "ending_cash",

    "gross_burn",
    "net_burn",

    "break_even_revenue",
  ];

  const rows =
    forecast.months.map(
      (
        month,
      ) => [
        forecast.projectId,
        forecast.projectName,
        forecast.scenario
          .name,
        forecast.scenario
          .type,
        forecast.currency,
        month.month,
        month.year,
        month.monthNumber,

        month.openingCustomers,
        month.paidNewCustomers,
        month.organicNewCustomers,
        month.newCustomers,
        month.churnedCustomers,
        month.endingCustomers,
        month.arpu,

        month.mrr,
        month.recurringRevenue,
        month.nonRecurringRevenue,
        month.oneTimeRevenue,
        month.revenue,

        month.cogs,
        month.grossProfit,
        month.grossMarginPercentage,

        month.salaries,
        month.rent,
        month.marketing,

        month.operatingExpenseBreakdown
          .software,
        month.operatingExpenseBreakdown
          .professionalServices,
        month.operatingExpenseBreakdown
          .insurance,
        month.operatingExpenseBreakdown
          .utilities,
        month.operatingExpenseBreakdown
          .travel,
        month.operatingExpenseBreakdown
          .other,
        month.operatingExpenseBreakdown
          .custom,

        month.otherOperatingExpenses,
        month.totalOperatingExpenses,

        month.ebitda,
        month.ebitdaMarginPercentage,

        month.interestExpense,
        month.profitBeforeTax,
        month.tax,
        month.netIncome,
        month.netMarginPercentage,

        month.operatingCashInflow,
        month.operatingCashOutflow,
        month.operatingCashFlow,

        month.financingInflows
          .equity,
        month.financingInflows
          .debt,
        month.financingInflows
          .grant,
        month.financingInflows
          .other,
        month.financingInflows
          .total,

        month.debtPrincipalRepayment,

        month.openingCash,
        month.netCashMovement,
        month.endingCash,

        month.grossBurn,
        month.netBurn,

        month.breakEvenRevenue,
      ],
    );

  const csv =
    [
      headers,
      ...rows,
    ]
      .map(
        (
          row,
        ) =>
          row
            .map(
              csvCell,
            )
            .join(
              ",",
            ),
      )
      .join(
        "\r\n",
      );

  return `\uFEFF${csv}\r\n`;
}
