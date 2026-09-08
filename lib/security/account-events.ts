import {
  logStructured,
} from "@/lib/observability/logger";


export function logAccountSecurityEvent(
  action:
    | "password.changed"
    | "sessions.revoked"
    | "account.deleted"
    | "password.change.rejected"
    | "account.delete.rejected",
  userId:
    string,
  metadata:
    Record<
      string,
      unknown
    > =
      {},
): void {
  logStructured(
    action.includes(
      "rejected",
    )
      ?
        "warn"
      :
        "info",
    "account.security",
    {
      action,
      actorUserId:
        userId,
      ...metadata,
    },
  );
}
