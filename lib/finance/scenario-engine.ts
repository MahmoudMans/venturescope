import {
  clampDecimal,
  decimal,
  toFinancialString,
} from "@/lib/finance/math";
import type {
  FinancialAssumptionsV1,
} from "@/lib/finance/assumptions/types";
import type {
  FinancialScenarioInput,
  RevenueMode,
} from "@/lib/finance/types";

type ScenarioModifiers = {
  revenueGrowthMultiplier: string;

  customerAcquisitionGrowthMultiplier: string;

  arpuMultiplier: string;

  cacMultiplier: string;

  churnPercentagePointDelta: string;

  cogsPercentagePointDelta: string;
};

const DEFAULT_MODIFIERS: ScenarioModifiers =
  {
    revenueGrowthMultiplier:
      "1",

    customerAcquisitionGrowthMultiplier:
      "1",

    arpuMultiplier:
      "1",

    cacMultiplier:
      "1",

    churnPercentagePointDelta:
      "0",

    cogsPercentagePointDelta:
      "0",
  };

function readModifier(
  modifiers: unknown,
  key: keyof ScenarioModifiers,
  fallback: string,
): string {
  if (
    !modifiers ||
    typeof modifiers !==
      "object" ||
    Array.isArray(
      modifiers,
    )
  ) {
    return fallback;
  }

  const value =
    (
      modifiers as Record<
        string,
        unknown
      >
    )[key];

  if (
    typeof value ===
      "number" ||
    typeof value ===
      "string"
  ) {
    const parsed =
      decimal(
        value,
      );

    if (
      parsed.isFinite()
    ) {
      return toFinancialString(
        parsed,
      );
    }
  }

  return fallback;
}

export function parseScenarioModifiers(
  scenario:
    | FinancialScenarioInput
    | undefined,
): ScenarioModifiers {
  if (
    !scenario ||
    scenario.type ===
      "BASE"
  ) {
    return {
      ...DEFAULT_MODIFIERS,
    };
  }

  return {
    revenueGrowthMultiplier:
      readModifier(
        scenario.modifiers,
        "revenueGrowthMultiplier",
        "1",
      ),

    customerAcquisitionGrowthMultiplier:
      readModifier(
        scenario.modifiers,
        "customerAcquisitionGrowthMultiplier",
        "1",
      ),

    arpuMultiplier:
      readModifier(
        scenario.modifiers,
        "arpuMultiplier",
        "1",
      ),

    cacMultiplier:
      readModifier(
        scenario.modifiers,
        "cacMultiplier",
        "1",
      ),

    churnPercentagePointDelta:
      readModifier(
        scenario.modifiers,
        "churnPercentagePointDelta",
        "0",
      ),

    cogsPercentagePointDelta:
      readModifier(
        scenario.modifiers,
        "cogsPercentagePointDelta",
        "0",
      ),
  };
}

function cloneAssumptions(
  assumptions: FinancialAssumptionsV1,
): FinancialAssumptionsV1 {
  return JSON.parse(
    JSON.stringify(
      assumptions,
    ),
  ) as FinancialAssumptionsV1;
}

function multiplyPercentageValue(
  value: string,
  multiplier: string,
): string {
  const result =
    decimal(
      value,
    ).mul(
      clampDecimal(
        decimal(
          multiplier,
        ),
        0,
        1000,
      ),
    );

  return toFinancialString(
    clampDecimal(
      result,
      -100,
      10000,
    ),
  );
}

export function applyScenarioToAssumptions(
  assumptions: FinancialAssumptionsV1,
  revenueMode: RevenueMode,
  scenario:
    | FinancialScenarioInput
    | undefined,
): FinancialAssumptionsV1 {
  const next =
    cloneAssumptions(
      assumptions,
    );

  if (
    !scenario ||
    scenario.type ===
      "BASE"
  ) {
    return next;
  }

  const modifiers =
    parseScenarioModifiers(
      scenario,
    );

  if (
    revenueMode ===
    "DIRECT"
  ) {
    next.directRevenue.monthlyGrowthRate =
      multiplyPercentageValue(
        next.directRevenue
          .monthlyGrowthRate,
        modifiers
          .revenueGrowthMultiplier,
      );
  } else {
    next.customerRevenue.customerAcquisitionGrowthRate =
      multiplyPercentageValue(
        next.customerRevenue
          .customerAcquisitionGrowthRate,
        modifiers
          .customerAcquisitionGrowthMultiplier,
      );

    const adjustedArpu =
      decimal(
        next.customerRevenue
          .arpu,
      ).mul(
        clampDecimal(
          decimal(
            modifiers.arpuMultiplier,
          ),
          0,
          1000,
        ),
      );

    next.customerRevenue.arpu =
      toFinancialString(
        adjustedArpu,
      );

    const adjustedCac =
      decimal(
        next.customerRevenue
          .cac,
      ).mul(
        clampDecimal(
          decimal(
            modifiers.cacMultiplier,
          ),
          0,
          1000,
        ),
      );

    next.customerRevenue.cac =
      toFinancialString(
        clampDecimal(
          adjustedCac,
          "0.000000000001",
          "1000000000000000",
        ),
      );

    const churnDeltaPercentagePoints =
      decimal(
        modifiers
          .churnPercentagePointDelta,
      ).mul(
        100,
      );

    next.customerRevenue.monthlyChurnRate =
      toFinancialString(
        clampDecimal(
          decimal(
            next.customerRevenue
              .monthlyChurnRate,
          ).plus(
            churnDeltaPercentagePoints,
          ),
          0,
          100,
        ),
      );
  }

  if (
    next.expenses.cogs
      .method ===
    "PERCENTAGE"
  ) {
    const cogsDeltaPercentagePoints =
      decimal(
        modifiers
          .cogsPercentagePointDelta,
      ).mul(
        100,
      );

    next.expenses.cogs.percentage =
      toFinancialString(
        clampDecimal(
          decimal(
            next.expenses.cogs
              .percentage,
          ).plus(
            cogsDeltaPercentagePoints,
          ),
          0,
          100,
        ),
      );
  }

  return next;
}
