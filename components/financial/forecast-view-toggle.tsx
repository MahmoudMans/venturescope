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

  scenarioId?: string;
};

export function ForecastViewToggle({
  pathname,
  view,
  scenarioId,
}: ForecastViewToggleProps) {
  function href(
    nextView: AnalysisTableView,
  ) {
    const params =
      new URLSearchParams();

    params.set(
      "view",
      nextView,
    );

    if (
      scenarioId
    ) {
      params.set(
        "scenario",
        scenarioId,
      );
    }

    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="inline-flex rounded-lg border bg-background p-1">
      <Link
        href={href(
          "monthly",
        )}
        className={cn(
          "touch-link rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          view ===
            "monthly"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Monthly
      </Link>

      <Link
        href={href(
          "annual",
        )}
        className={cn(
          "touch-link rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
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
