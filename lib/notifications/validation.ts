import {
  PROJECT_ALERT_CATEGORIES,
  type ProjectAlertCategory,
} from "@/lib/notifications/types";


export const ALERT_RECEIPT_OPERATIONS = [
  "READ",
  "UNREAD",
  "DISMISS",
  "SNOOZE_24H",
] as const;


export type AlertReceiptOperation =
  typeof ALERT_RECEIPT_OPERATIONS[
    number
  ];


export function parseAlertReceiptOperation(
  value:
    string,
): AlertReceiptOperation {
  if (
    ALERT_RECEIPT_OPERATIONS.includes(
      value as
        AlertReceiptOperation,
    )
  ) {
    return value as
      AlertReceiptOperation;
  }


  throw new Error(
    "Invalid alert inbox operation.",
  );
}


export function parseAlertKey(
  value:
    string,
): string {
  const normalized =
    value.trim();


  if (
    normalized.length <
      3 ||
    normalized.length >
      180 ||
    !/^[A-Za-z0-9:_\-.]+$/u.test(
      normalized,
    )
  ) {
    throw new Error(
      "Alert key is invalid.",
    );
  }


  return normalized;
}


export function parseAlertFingerprint(
  value:
    string,
): string {
  const normalized =
    value.trim();


  if (
    !/^[a-f0-9]{16}$/u.test(
      normalized,
    )
  ) {
    throw new Error(
      "Alert fingerprint is invalid.",
    );
  }


  return normalized;
}


export function parseProjectAlertCategory(
  value:
    string,
): ProjectAlertCategory {
  if (
    PROJECT_ALERT_CATEGORIES.includes(
      value as
        ProjectAlertCategory,
    )
  ) {
    return value as
      ProjectAlertCategory;
  }


  throw new Error(
    "Alert category is invalid.",
  );
}
