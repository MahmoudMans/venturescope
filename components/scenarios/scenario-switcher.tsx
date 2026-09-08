"use client";

import {
  LoaderCircle,
} from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useTransition,
} from "react";

import type {
  ScenarioSwitcherOption,
} from "@/lib/scenarios/types";

type ScenarioSwitcherProps = {
  scenarios: ScenarioSwitcherOption[];

  currentScenarioId: string;
};

export function ScenarioSwitcher({
  scenarios,
  currentScenarioId,
}: ScenarioSwitcherProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const [
    pending,
    startTransition,
  ] = useTransition();

  function selectScenario(
    scenarioId: string,
  ) {
    const params =
      new URLSearchParams(
        searchParams.toString(),
      );

    params.set(
      "scenario",
      scenarioId,
    );

    startTransition(
      () => {
        router.push(
          `${pathname}?${params.toString()}`,
        );
      },
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
      {pending ? (
        <LoaderCircle
          className="size-4 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}

      <label
        htmlFor="analysis-scenario"
        className="text-xs font-medium text-muted-foreground"
      >
        Scenario
      </label>

      <select
        id="analysis-scenario"
        value={
          currentScenarioId
        }
        onChange={(
          event,
        ) =>
          selectScenario(
            event.target.value,
          )
        }
        disabled={
          pending
        }
        className="h-8 max-w-52 bg-transparent text-sm font-medium outline-none"
      >
        {scenarios.map(
          (
            scenario,
          ) => (
            <option
              key={
                scenario.id
              }
              value={
                scenario.id
              }
            >
              {
                scenario.name
              }
            </option>
          ),
        )}
      </select>
    </div>
  );
}
