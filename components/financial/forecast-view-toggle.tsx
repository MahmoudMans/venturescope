import Link from "next/link";

import type {
  AnalysisTableView,
} from "@/lib/finance/formatting";
import {
  cn,
} from "@/lib/utils";

type ForecastViewToggleProps = {
  pathname: string;

  view: AnalysisTableView;
};

export function ForecastViewToggle({
  pathname,
  view,
}: ForecastViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border bg-background p-1">
      <Link
        href={`${pathname}?view=monthly`}
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          view ===
            "monthly"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Monthly
      </Link>

      <Link
        href={`${pathname}?view=annual`}
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          view ===
            "annual"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Annual
      </Link>
    </div>
  );
}
