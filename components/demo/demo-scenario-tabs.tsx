import Link from "next/link";

import type {
  FinancialScenarioInput,
} from "@/lib/finance/types";
import {
  cn,
} from "@/lib/utils";

export function DemoScenarioTabs({
  scenarios,
  activeScenarioId,
}: {
  scenarios: FinancialScenarioInput[];

  activeScenarioId: string;
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl border bg-background p-1">
      {scenarios.map(
        (
          scenario,
        ) => {
          const active =
            scenario.id ===
            activeScenarioId;

          return (
            <Link
              key={
                scenario.id
              }
              href={`/demo?scenario=${encodeURIComponent(
                scenario.id ??
                "",
              )}`}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {
                scenario.name
              }
            </Link>
          );
        },
      )}
    </div>
  );
}
