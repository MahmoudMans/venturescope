import {
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

import type {
  MonthlyOverrideActionState,
} from "@/lib/overrides/action-state";
import {
  cn,
} from "@/lib/utils";

export function OverrideActionMessage({
  state,
}: {
  state: MonthlyOverrideActionState;
}) {
  if (
    !state.message
  ) {
    return null;
  }

  const success =
    state.status ===
    "success";

  const Icon =
    success
      ? CheckCircle2
      : CircleAlert;

  return (
    <div
      role={
        success
          ? "status"
          : "alert"
      }
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        success
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-destructive/30 bg-destructive/5 text-destructive",
      )}
    >
      <Icon
        className="mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />

      {
        state.message
      }
    </div>
  );
}
