import {
  decimal,
  toFinancialString,
} from "@/lib/finance/math";
import type {
  RevenueMode,
} from "@/lib/finance/types";
import type {
  ScenarioModifierFormValues,
  ScenarioStorageModifiers,
  ScenarioViewModel,
} from "@/lib/scenarios/types";

const NEUTRAL_MULTIPLIER =
  "1";

const ZERO =
  "0";

function readModifier(
  modifiers: unknown,
  key: string,
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
    typeof value !==
      "number" &&
    typeof value !==
      "string"
  ) {
    return fallback;
  }

  return toFinancialString(
    decimal(
      value,
    ),
  );
}

function multiplierToAdjustment(
  multiplier: string,
): string {
  return toFinancialString(
    decimal(
      multiplier,
    )
      .minus(
        1,
      )
      .mul(
        100,
      ),
  );
}

function deltaRateToPercentagePoints(
  value: string,
): string {
  return toFinancialString(
    decimal(
      value,
    ).mul(
      100,
    ),
  );
}

export function neutralScenarioModifierFormValues(): ScenarioModifierFormValues {
  return {
    growthAdjustmentPercentage:
      "0",

    arpuAdjustmentPercentage:
      "0",

    cacAdjustmentPercentage:
      "0",

    churnDeltaPercentagePoints:
      "0",

    cogsDeltaPercentagePoints:
      "0",
  };
}

export function scenarioModifiersToFormValues(
  modifiers: unknown,
  revenueMode: RevenueMode,
): ScenarioModifierFormValues {
  const revenueGrowthMultiplier =
    readModifier(
      modifiers,
      "revenueGrowthMultiplier",
      NEUTRAL_MULTIPLIER,
    );

  const acquisitionGrowthMultiplier =
    readModifier(
      modifiers,
      "customerAcquisitionGrowthMultiplier",
      NEUTRAL_MULTIPLIER,
    );

  const growthMultiplier =
    revenueMode ===
    "DIRECT"
      ? revenueGrowthMultiplier
      : acquisitionGrowthMultiplier;

  return {
    growthAdjustmentPercentage:
      multiplierToAdjustment(
        growthMultiplier,
      ),

    arpuAdjustmentPercentage:
      multiplierToAdjustment(
        readModifier(
          modifiers,
          "arpuMultiplier",
          NEUTRAL_MULTIPLIER,
        ),
      ),

    cacAdjustmentPercentage:
      multiplierToAdjustment(
        readModifier(
          modifiers,
          "cacMultiplier",
          NEUTRAL_MULTIPLIER,
        ),
      ),

    churnDeltaPercentagePoints:
      deltaRateToPercentagePoints(
        readModifier(
          modifiers,
          "churnPercentagePointDelta",
          ZERO,
        ),
      ),

    cogsDeltaPercentagePoints:
      deltaRateToPercentagePoints(
        readModifier(
          modifiers,
          "cogsPercentagePointDelta",
          ZERO,
        ),
      ),
  };
}

function adjustmentToMultiplier(
  value: string,
): string {
  return toFinancialString(
    decimal(
      value,
    )
      .div(
        100,
      )
      .plus(
        1,
      ),
  );
}

function percentagePointsToDeltaRate(
  value: string,
): string {
  return toFinancialString(
    decimal(
      value,
    ).div(
      100,
    ),
  );
}

export function scenarioFormValuesToStorageModifiers(
  values: ScenarioModifierFormValues,
): ScenarioStorageModifiers {
  const growthMultiplier =
    adjustmentToMultiplier(
      values.growthAdjustmentPercentage,
    );

  return {
    revenueGrowthMultiplier:
      growthMultiplier,

    customerAcquisitionGrowthMultiplier:
      growthMultiplier,

    arpuMultiplier:
      adjustmentToMultiplier(
        values.arpuAdjustmentPercentage,
      ),

    cacMultiplier:
      adjustmentToMultiplier(
        values.cacAdjustmentPercentage,
      ),

    churnPercentagePointDelta:
      percentagePointsToDeltaRate(
        values.churnDeltaPercentagePoints,
      ),

    cogsPercentagePointDelta:
      percentagePointsToDeltaRate(
        values.cogsDeltaPercentagePoints,
      ),
  };
}

export function serializeScenarioForManagement(
  scenario: {
    id: string;

    name: string;

    type: string;

    modifiers: unknown;
  },
  revenueMode: RevenueMode,
): ScenarioViewModel {
  if (
    scenario.type !==
      "BASE" &&
    scenario.type !==
      "BULL" &&
    scenario.type !==
      "BEAR" &&
    scenario.type !==
      "CUSTOM"
  ) {
    throw new Error(
      `Unsupported scenario type: ${scenario.type}`,
    );
  }

  return {
    id:
      scenario.id,

    name:
      scenario.name,

    type:
      scenario.type,

    modifiers:
      scenarioModifiersToFormValues(
        scenario.modifiers,
        revenueMode,
      ),
  };
}
