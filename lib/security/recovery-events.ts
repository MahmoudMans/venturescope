import { logStructured } from "@/lib/observability/logger";

export type RecoveryEventAction =
  | "recovery-key.revealed"
  | "recovery-key.reveal.rejected"
  | "password.reset"
  | "password.reset.rejected";

/** Never pass the key, the password or the email address here. */
export function logRecoveryEvent(
  action: RecoveryEventAction,
  userId: string,
  metadata: Record<string, string | number | boolean | null> = {},
): void {
  logStructured(action.includes("rejected") ? "warn" : "info", "account.security", {
    action,
    actorUserId: userId,
    ...metadata,
  });
}
