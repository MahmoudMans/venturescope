import {
  logStructured,
} from "@/lib/observability/logger";


export function logAccountSecurityEvent(
  action:
    | "password.changed"
    | "sessions.revoked"
    | "account.deleted"
    | "password.change.rejected"
    | "account.delete.rejected"
    | "data.exported"
    | "data.export.rejected"
    | "email.changed"
    | "email.change.rejected"
    | "workspace.transferred"
    | "workspace.transfer.rejected",
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
