import { ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type VentureScopeLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  /** Use "inverse" on dark brand surfaces. */
  tone?: "default" | "inverse";
  /** Hide the name on screens narrower than 360px, so the buttons next to the logo fit. */
  shortOnPhone?: boolean;
};

export function VentureScopeLogo({
  href = "/",
  compact = false,
  className,
  tone = "default",
  shortOnPhone = false,
}: VentureScopeLogoProps) {
  const inverse = tone === "inverse";

  const content = (
    <div
      className={cn("inline-flex items-center gap-2.5", href !== "" && "touch-reach", className)}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-xl shadow-sm",
          inverse
            ? "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur"
            : "bg-brand-gradient text-white ring-1 ring-black/5",
        )}
      >
        <ChartNoAxesCombined className="size-5" aria-hidden="true" />
      </div>

      {compact ? null : (
        <div className={cn("flex flex-col leading-none", shortOnPhone && "max-[360px]:hidden")}>
          <span className={cn("text-[15px] font-semibold tracking-tight", inverse && "text-white")}>
            VentureScope
          </span>

          <span
            className={cn(
              "mt-1 text-[10px] font-medium uppercase tracking-[0.18em]",
              inverse ? "text-white/65" : "text-muted-foreground",
            )}
          >
            Financial Intelligence
          </span>
        </div>
      )}
    </div>
  );

  if (href === "") {
    return content;
  }

  return (
    <Link href={href} aria-label="VentureScope home">
      {content}
    </Link>
  );
}
