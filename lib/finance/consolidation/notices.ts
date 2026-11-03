export type ConsolidationNotice = {
  tone: "success";
  message: string;
};

/**
 * Messages for the "?status=" codes that the Consolidation Center actions
 * attach when they send a person back to the page.
 */
const NOTICES: Record<string, ConsolidationNotice> = {
  "settings-saved": {
    tone: "success",
    message: "Reporting currency saved. Consolidated figures now use it.",
  },

  "rate-saved": {
    tone: "success",
    message: "Exchange rate saved.",
  },

  "rate-deleted": {
    tone: "success",
    message: "Exchange rate removed.",
  },
};

export function getConsolidationNotice(
  code: string | string[] | undefined,
): ConsolidationNotice | null {
  if (typeof code !== "string") {
    return null;
  }

  return Object.hasOwn(NOTICES, code) ? NOTICES[code] : null;
}
