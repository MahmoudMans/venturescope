export const DEFAULT_PROJECT_SCENARIOS = [
  {
    name: "Base Case",
    type: "BASE" as const,
    modifiers: {},
  },

  {
    name: "Bull Case",
    type: "BULL" as const,
    modifiers: {
      revenueGrowthMultiplier: 1.2,
      customerAcquisitionGrowthMultiplier: 1.2,
      arpuMultiplier: 1.05,
      cacMultiplier: 0.9,
      churnPercentagePointDelta: -0.01,
      cogsPercentagePointDelta: -0.02,
    },
  },

  {
    name: "Bear Case",
    type: "BEAR" as const,
    modifiers: {
      revenueGrowthMultiplier: 0.8,
      customerAcquisitionGrowthMultiplier: 0.8,
      arpuMultiplier: 0.95,
      cacMultiplier: 1.15,
      churnPercentagePointDelta: 0.02,
      cogsPercentagePointDelta: 0.03,
    },
  },
] as const;
