import {
  ChartNoAxesCombined,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type VentureScopeLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function VentureScopeLogo({
  href = "/",
  compact = false,
  className,
}: VentureScopeLogoProps) {
  const content = (
    <div
      className={cn(
        "inline-flex items-center gap-2.5",
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
        <ChartNoAxesCombined
          className="size-5"
          aria-hidden="true"
        />
      </div>

      {!compact ? (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">
            VentureScope
          </span>

          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Financial Intelligence
          </span>
        </div>
      ) : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      aria-label="VentureScope home"
    >
      {content}
    </Link>
  );
}
