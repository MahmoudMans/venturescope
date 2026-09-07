export function formatRevenueMode(
  revenueMode: string,
): string {
  switch (revenueMode) {
    case "DIRECT":
      return "Direct revenue";

    case "CUSTOMER_DRIVEN":
      return "Customer-driven";

    default:
      return revenueMode;
  }
}

export function formatScenarioType(
  type: string,
): string {
  switch (type) {
    case "BASE":
      return "Base";

    case "BULL":
      return "Bull";

    case "BEAR":
      return "Bear";

    case "CUSTOM":
      return "Custom";

    default:
      return type;
  }
}

export function countScenarioModifiers(
  modifiers: unknown,
): number {
  if (
    !modifiers ||
    typeof modifiers !== "object" ||
    Array.isArray(modifiers)
  ) {
    return 0;
  }

  return Object.keys(
    modifiers,
  ).length;
}
