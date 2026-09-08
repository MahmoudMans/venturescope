import type {
  RevenueMode,
  ScenarioType,
} from "@/lib/finance/types";

export type ScenarioModifierFormValues = {
  growthAdjustmentPercentage: string;

  arpuAdjustmentPercentage: string;

  cacAdjustmentPercentage: string;

  churnDeltaPercentagePoints: string;

  cogsDeltaPercentagePoints: string;
};

export type ScenarioStorageModifiers = {
  revenueGrowthMultiplier: string;

  customerAcquisitionGrowthMultiplier: string;

  arpuMultiplier: string;

  cacMultiplier: string;

  churnPercentagePointDelta: string;

  cogsPercentagePointDelta: string;
};

export type ScenarioViewModel = {
  id: string;

  name: string;

  type: ScenarioType;

  modifiers: ScenarioModifierFormValues;
};

export type ScenarioSwitcherOption = {
  id: string;

  name: string;

  type: ScenarioType;
};

export type ScenarioProjectMode =
  RevenueMode;
