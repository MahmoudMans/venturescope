import type {
  ProjectAlert,
  ProjectAlertInbox,
  ProjectAlertReceiptView,
  ResolvedProjectAlert,
} from "@/lib/notifications/types";


export function resolveProjectAlertInbox({
  alerts,
  receipts,
  now,
}: {
  alerts:
    ProjectAlert[];

  receipts:
    ProjectAlertReceiptView[];

  now:
    Date;
}): ProjectAlertInbox {
  const receiptByKey =
    new Map(
      receipts.map(
        (
          receipt,
        ) => [
          receipt.alertKey,
          receipt,
        ],
      ),
    );


  const resolved:
    ResolvedProjectAlert[] =
      alerts.map(
        (
          alert,
        ) => {
          const stored =
            receiptByKey.get(
              alert.key,
            ) ??
            null;


          const sameFingerprint =
            stored?.fingerprint ===
            alert.fingerprint;


          const receipt =
            sameFingerprint
              ?
                stored
              :
                null;


          const dismissed =
            Boolean(
              receipt?.dismissedAt,
            );


          const snoozed =
            receipt?.snoozedUntil
              ?
                new Date(
                  receipt.snoozedUntil,
                ).getTime() >
                now.getTime()
              :
                false;


          return {
            alert,

            read:
              Boolean(
                receipt?.readAt,
              ),

            dismissed,

            snoozed,

            changedSinceReceipt:
              Boolean(
                stored &&
                !sameFingerprint
              ),

            receipt,
          };
        },
      );


  const visible =
    resolved.filter(
      (
        item,
      ) =>
        !item.dismissed &&
        !item.snoozed,
    );


  const dismissed =
    resolved.filter(
      (
        item,
      ) =>
        item.dismissed,
    );


  const snoozed =
    resolved.filter(
      (
        item,
      ) =>
        !item.dismissed &&
        item.snoozed,
    );


  return {
    visible,

    dismissed,

    snoozed,

    summary: {
      total:
        resolved.length,

      visible:
        visible.length,

      unread:
        visible.filter(
          (
            item,
          ) =>
            !item.read,
        ).length,

      critical:
        visible.filter(
          (
            item,
          ) =>
            item.alert.severity ===
            "CRITICAL",
        ).length,

      warning:
        visible.filter(
          (
            item,
          ) =>
            item.alert.severity ===
            "WARNING",
        ).length,

      dismissed:
        dismissed.length,

      snoozed:
        snoozed.length,
    },
  };
}
