import type {
  FinancingEventType,
} from "@/lib/financing/types";

export function formatFinancingType(
  type: FinancingEventType,
): string {
  switch (
    type
  ) {
    case "EQUITY":
      return "Equity";

    case "DEBT":
      return "Debt";

    case "GRANT":
      return "Grant";

    case "OTHER":
      return "Other";
  }
}

export function financingTypeDescription(
  type: FinancingEventType,
): string {
  switch (
    type
  ) {
    case "EQUITY":
      return "Cash contribution without debt repayment.";

    case "DEBT":
      return "Loan financing with interest and principal repayment.";

    case "GRANT":
      return "Non-repayable grant financing.";

    case "OTHER":
      return "Other external cash financing.";
  }
}
