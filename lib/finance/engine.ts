import Decimal from "decimal.js";

import {
  aggregateAnnualForecast,
} from "@/lib/finance/aggregation";
import {
  calculateCustomerRevenueMonth,
} from "@/lib/finance/customer-engine";
import {
  enumerateMonths,
  monthNumberFromMonth,
  yearFromMonth,
} from "@/lib/finance/dates";
import {
  calculateCogs,
  calculateMonthlyExpenseProfile,
} from "@/lib/finance/expense-engine";
import {
  calculateFinancingForMonth,
} from "@/lib/finance/financing-engine";
import {
  ZERO,
  decimal,
  maxZero,
  nullableFinancialString,
  percentageRatio,
  percentageToRate,
  sumDecimals,
  toFinancialString,
} from "@/lib/finance/math";
import {
  calculateFinancialMetrics,
} from "@/lib/finance/metrics";
import {
  calculateDirectRevenueMonth,
} from "@/lib/finance/revenue-engine";
import {
  applyMonthlyExpenseOverrides,
  applyMonthlyRevenueOverride,
  customerRuntimeOverrides,
  resolveMonthlyOverride,
} from "@/lib/finance/override-engine";
import {
  applyScenarioToAssumptions,
} from "@/lib/finance/scenario-engine";
import type {
  FinancialForecast,
  FinancialModelInput,
  MonthlyForecast,
} from "@/lib/finance/types";

function assertFinancialModelInput(
  input: FinancialModelInput,
): void {
  if (
    !input.projectId
  ) {
    throw new Error(
      "Financial model projectId is required.",
    );
  }

  if (
    !input.projectName
  ) {
    throw new Error(
      "Financial model projectName is required.",
    );
  }

  if (
    !Number.isInteger(
      input.horizonMonths,
    ) ||
    input.horizonMonths <
      12 ||
    input.horizonMonths >
      60
  ) {
    throw new Error(
      "Financial forecast horizon must be 12, 24, 36, 48 or 60 months.",
    );
  }

  if (
    ![
      12,
      24,
      36,
      48,
      60,
    ].includes(
      input.horizonMonths,
    )
  ) {
    throw new Error(
      "Unsupported VentureScope forecast horizon.",
    );
  }
}

function calculateBreakEvenRevenue(
  totalOperatingExpensesBeforeCogs: Decimal,
  cogsMethod:
    | "PERCENTAGE"
    | "FIXED_MONTHLY",
  cogsPercentageRate: Decimal,
  fixedMonthlyCogs: Decimal,
): Decimal | null {
  if (
    cogsMethod ===
    "FIXED_MONTHLY"
  ) {
    return totalOperatingExpensesBeforeCogs.plus(
      fixedMonthlyCogs,
    );
  }

  const contributionMargin =
    new Decimal(
      1,
    ).minus(
      cogsPercentageRate,
    );

  if (
    contributionMargin.lte(
      ZERO,
    )
  ) {
    return null;
  }

  return totalOperatingExpensesBeforeCogs.div(
    contributionMargin,
  );
}

export function generateFinancialForecast(
  input: FinancialModelInput,
): FinancialForecast {
  assertFinancialModelInput(
    input,
  );

  const scenario =
    input.scenario ?? {
      name: "Base Case",
      type: "BASE" as const,
      modifiers: {},
    };

  const assumptions =
    applyScenarioToAssumptions(
      input.assumptions,
      input.revenueMode,
      scenario,
    );

  const forecastMonths =
    enumerateMonths(
      input.startMonth,
      input.horizonMonths,
    );

  const financingEvents =
    input.financingEvents ??
    [];

  let openingCash =
    decimal(
      assumptions.general
        .startingCash,
    );

  let openingCustomers =
    input.revenueMode ===
    "CUSTOMER_DRIVEN"
      ? decimal(
          assumptions
            .customerRevenue
            .startingCustomers,
        )
      : new Decimal(
          0,
        );

  const monthlyForecast: MonthlyForecast[] =
    [];

  for (
    let index =
      0;
    index <
    forecastMonths.length;
    index +=
      1
  ) {
    const month =
      forecastMonths[
        index
      ];

    const resolvedOverride =
      resolveMonthlyOverride(
        input.monthlyOverrides ??
        [],
        scenario.id,
        month,
      );

    let expenseProfile =
      calculateMonthlyExpenseProfile(
        assumptions.expenses,
        index,
      );

    expenseProfile =
      applyMonthlyExpenseOverrides(
        expenseProfile,
        resolvedOverride.values,
      );

    let openingCustomersOutput:
      | Decimal
      | null =
      null;

    let paidNewCustomers:
      | Decimal
      | null =
      null;

    let organicNewCustomers:
      | Decimal
      | null =
      null;

    let newCustomers:
      | Decimal
      | null =
      null;

    let churnedCustomers:
      | Decimal
      | null =
      null;

    let endingCustomers:
      | Decimal
      | null =
      null;

    let arpu:
      | Decimal
      | null =
      null;

    let mrr =
      new Decimal(
        0,
      );

    let recurringRevenue =
      new Decimal(
        0,
      );

    let nonRecurringRevenue =
      new Decimal(
        0,
      );

    let oneTimeRevenue =
      new Decimal(
        0,
      );

    let revenue =
      new Decimal(
        0,
      );

    if (
      input.revenueMode ===
      "DIRECT"
    ) {
      const revenueResult =
        calculateDirectRevenueMonth(
          assumptions.directRevenue,
          index,
        );

      mrr =
        revenueResult.mrr;

      recurringRevenue =
        revenueResult.recurringRevenue;

      nonRecurringRevenue =
        revenueResult.nonRecurringRevenue;

      oneTimeRevenue =
        revenueResult.oneTimeRevenue;

      revenue =
        revenueResult.totalRevenue;
    } else {
      const revenueResult =
        calculateCustomerRevenueMonth(
          assumptions.customerRevenue,
          index,
          openingCustomers,
          expenseProfile.marketing,
          customerRuntimeOverrides(
            resolvedOverride.values,
          ),
        );

      openingCustomersOutput =
        revenueResult.openingCustomers;

      paidNewCustomers =
        revenueResult.paidNewCustomers;

      organicNewCustomers =
        revenueResult.organicNewCustomers;

      newCustomers =
        revenueResult.newCustomers;

      churnedCustomers =
        revenueResult.churnedCustomers;

      endingCustomers =
        revenueResult.endingCustomers;

      arpu =
        revenueResult.arpu;

      mrr =
        revenueResult.mrr;

      recurringRevenue =
        revenueResult.recurringRevenue;

      nonRecurringRevenue =
        revenueResult.nonRecurringRevenue;

      oneTimeRevenue =
        revenueResult.oneTimeRevenue;

      revenue =
        revenueResult.totalRevenue;
    }

    const revenueOverrideResult =
      applyMonthlyRevenueOverride({
        revenueMode:
          input.revenueMode,

        overrideRevenue:
          resolvedOverride.values
            .revenue,

        recurringRevenuePercentage:
          assumptions.directRevenue
            .recurringRevenuePercentage,

        recurringRevenue,

        nonRecurringRevenue,

        oneTimeRevenue,

        totalRevenue:
          revenue,

        mrr,
      });

    recurringRevenue =
      revenueOverrideResult
        .recurringRevenue;

    nonRecurringRevenue =
      revenueOverrideResult
        .nonRecurringRevenue;

    oneTimeRevenue =
      revenueOverrideResult
        .oneTimeRevenue;

    revenue =
      revenueOverrideResult
        .totalRevenue;

    mrr =
      revenueOverrideResult
        .mrr;

    const cogs =
      resolvedOverride.values
        .cogs !==
      undefined
        ? maxZero(
            decimal(
              resolvedOverride.values
                .cogs,
            ),
          )
        : calculateCogs(
            expenseProfile,
            revenue,
          );

    const grossProfit =
      revenue.minus(
        cogs,
      );

    const totalOperatingExpenses =
      expenseProfile
        .totalOperatingExpensesBeforeCogs;

    const ebitda =
      grossProfit.minus(
        totalOperatingExpenses,
      );

    const financing =
      calculateFinancingForMonth(
        financingEvents,
        month,
      );

    const interestExpense =
      financing.interestExpense;

    const profitBeforeTax =
      ebitda.minus(
        interestExpense,
      );

    const taxRate =
      percentageToRate(
        assumptions.general
          .corporateTaxRate,
      );

    const tax =
      profitBeforeTax.gt(
        ZERO,
      )
        ? profitBeforeTax.mul(
            taxRate,
          )
        : new Decimal(
            0,
          );

    const netIncome =
      profitBeforeTax.minus(
        tax,
      );

    const operatingCashInflow =
      revenue;

    const operatingCashOutflow =
      sumDecimals([
        cogs,
        totalOperatingExpenses,
        interestExpense,
        tax,
      ]);

    const operatingCashFlow =
      operatingCashInflow.minus(
        operatingCashOutflow,
      );

    const netCashMovement =
      operatingCashFlow
        .plus(
          financing.totalInflow,
        )
        .minus(
          financing.principalRepayment,
        );

    const endingCash =
      openingCash.plus(
        netCashMovement,
      );

    const grossBurn =
      cogs.plus(
        totalOperatingExpenses,
      );

    const netBurn =
      maxZero(
        grossBurn.minus(
          operatingCashInflow,
        ),
      );

    const grossMargin =
      percentageRatio(
        grossProfit,
        revenue,
      );

    const ebitdaMargin =
      percentageRatio(
        ebitda,
        revenue,
      );

    const netMargin =
      percentageRatio(
        netIncome,
        revenue,
      );

    const breakEvenRevenue =
      calculateBreakEvenRevenue(
        totalOperatingExpenses,
        expenseProfile.cogsMethod,
        expenseProfile
          .cogsPercentageRate,
        expenseProfile
          .fixedMonthlyCogs,
      );

    monthlyForecast.push({
      index,

      month,

      year:
        yearFromMonth(
          month,
        ),

      monthNumber:
        monthNumberFromMonth(
          month,
        ),

      openingCustomers:
        openingCustomersOutput
          ? toFinancialString(
              openingCustomersOutput,
            )
          : null,

      paidNewCustomers:
        paidNewCustomers
          ? toFinancialString(
              paidNewCustomers,
            )
          : null,

      organicNewCustomers:
        organicNewCustomers
          ? toFinancialString(
              organicNewCustomers,
            )
          : null,

      newCustomers:
        newCustomers
          ? toFinancialString(
              newCustomers,
            )
          : null,

      churnedCustomers:
        churnedCustomers
          ? toFinancialString(
              churnedCustomers,
            )
          : null,

      endingCustomers:
        endingCustomers
          ? toFinancialString(
              endingCustomers,
            )
          : null,

      arpu:
        arpu
          ? toFinancialString(
              arpu,
            )
          : null,

      mrr:
        toFinancialString(
          mrr,
        ),

      recurringRevenue:
        toFinancialString(
          recurringRevenue,
        ),

      nonRecurringRevenue:
        toFinancialString(
          nonRecurringRevenue,
        ),

      oneTimeRevenue:
        toFinancialString(
          oneTimeRevenue,
        ),

      revenue:
        toFinancialString(
          revenue,
        ),

      cogs:
        toFinancialString(
          cogs,
        ),

      grossProfit:
        toFinancialString(
          grossProfit,
        ),

      grossMarginPercentage:
        nullableFinancialString(
          grossMargin,
        ),

      salaries:
        toFinancialString(
          expenseProfile.salaries,
        ),

      rent:
        toFinancialString(
          expenseProfile.rent,
        ),

      marketing:
        toFinancialString(
          expenseProfile.marketing,
        ),

      operatingExpenseBreakdown: {
        software:
          toFinancialString(
            expenseProfile.software,
          ),

        professionalServices:
          toFinancialString(
            expenseProfile.professionalServices,
          ),

        insurance:
          toFinancialString(
            expenseProfile.insurance,
          ),

        utilities:
          toFinancialString(
            expenseProfile.utilities,
          ),

        travel:
          toFinancialString(
            expenseProfile.travel,
          ),

        other:
          toFinancialString(
            expenseProfile.other,
          ),

        custom:
          toFinancialString(
            expenseProfile.custom,
          ),
      },

      otherOperatingExpenses:
        toFinancialString(
          expenseProfile.otherOperatingExpenses,
        ),

      totalOperatingExpenses:
        toFinancialString(
          totalOperatingExpenses,
        ),

      ebitda:
        toFinancialString(
          ebitda,
        ),

      ebitdaMarginPercentage:
        nullableFinancialString(
          ebitdaMargin,
        ),

      interestExpense:
        toFinancialString(
          interestExpense,
        ),

      profitBeforeTax:
        toFinancialString(
          profitBeforeTax,
        ),

      tax:
        toFinancialString(
          tax,
        ),

      netIncome:
        toFinancialString(
          netIncome,
        ),

      netMarginPercentage:
        nullableFinancialString(
          netMargin,
        ),

      operatingCashInflow:
        toFinancialString(
          operatingCashInflow,
        ),

      operatingCashOutflow:
        toFinancialString(
          operatingCashOutflow,
        ),

      operatingCashFlow:
        toFinancialString(
          operatingCashFlow,
        ),

      financingInflows: {
        equity:
          toFinancialString(
            financing.equityInflow,
          ),

        debt:
          toFinancialString(
            financing.debtInflow,
          ),

        grant:
          toFinancialString(
            financing.grantInflow,
          ),

        other:
          toFinancialString(
            financing.otherInflow,
          ),

        total:
          toFinancialString(
            financing.totalInflow,
          ),
      },

      debtPrincipalRepayment:
        toFinancialString(
          financing.principalRepayment,
        ),

      openingCash:
        toFinancialString(
          openingCash,
        ),

      netCashMovement:
        toFinancialString(
          netCashMovement,
        ),

      endingCash:
        toFinancialString(
          endingCash,
        ),

      grossBurn:
        toFinancialString(
          grossBurn,
        ),

      netBurn:
        toFinancialString(
          netBurn,
        ),

      breakEvenRevenue:
        nullableFinancialString(
          breakEvenRevenue,
        ),
    });

    openingCash =
      endingCash;

    if (
      input.revenueMode ===
        "CUSTOMER_DRIVEN" &&
      endingCustomers
    ) {
      openingCustomers =
        endingCustomers;
    }
  }

  const annual =
    aggregateAnnualForecast(
      monthlyForecast,
    );

  const metrics =
    calculateFinancialMetrics(
      monthlyForecast,
      annual,
      assumptions.general
        .startingCash,
    );

  return {
    projectId:
      input.projectId,

    projectName:
      input.projectName,

    currency:
      input.currency,

    revenueMode:
      input.revenueMode,

    modelVersion:
      input.modelVersion,

    startMonth:
      input.startMonth,

    horizonMonths:
      input.horizonMonths,

    scenario: {
      id:
        scenario.id,

      name:
        scenario.name,

      type:
        scenario.type,
    },

    months:
      monthlyForecast,

    annual,

    metrics,
  };
}
