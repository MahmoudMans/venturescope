import { CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusNoticeTone = "error" | "success" | "info";

const tones: Record<StatusNoticeTone, { icon: LucideIcon; role: "alert" | "status"; box: string }> =
  {
    error: {
      icon: CircleAlert,
      role: "alert",
      box: "border-destructive/30 bg-destructive/5 text-destructive",
    },

    success: {
      icon: CircleCheck,
      role: "status",
      box: "border-success/30 bg-success/5 text-success",
    },

    info: {
      icon: Info,
      role: "status",
      box: "border-info/30 bg-info/5 text-info",
    },
  };

export function StatusNotice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: StatusNoticeTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const config = tones[tone];

  const Icon = config.icon;

  return (
    <div
      role={config.role}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        config.box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />

      <div className="min-w-0 space-y-0.5">
        {title ? <div className="font-medium">{title}</div> : null}

        <div>{children}</div>
      </div>
    </div>
  );
}
