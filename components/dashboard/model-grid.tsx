"use client";

import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MODEL_FILTER_OPTIONS,
  MODEL_LIST_CONTROLS_THRESHOLD,
  filterAndSortModels,
  type ModelSort,
  type ModelStatusFilter,
} from "@/lib/dashboard/model-list";
import type { DashboardModel } from "@/lib/dashboard/summary";

const selectClassName =
  "h-9 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/10";

export function DashboardModelGrid({ models }: { models: DashboardModel[] }) {
  const [query, setQuery] = useState("");

  const [sort, setSort] = useState<ModelSort>("updated");

  const [status, setStatus] = useState<ModelStatusFilter>("all");

  const showControls = models.length >= MODEL_LIST_CONTROLS_THRESHOLD;

  const visible = useMemo(
    () => (showControls ? filterAndSortModels(models, { query, sort, status }) : models),
    [models, showControls, query, sort, status],
  );

  function clearFilters() {
    setQuery("");

    setStatus("all");
  }

  return (
    <div>
      {showControls ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              type="search"
              aria-label="Search models"
              placeholder="Search by name or industry"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 pl-9"
            />
          </div>

          <label htmlFor="model-sort" className="sr-only">
            Sort models
          </label>

          <select
            id="model-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as ModelSort)}
            className={selectClassName}
          >
            <option value="updated">Recently updated</option>

            <option value="name">Name (A to Z)</option>

            <option value="runway">Shortest runway first</option>
          </select>

          <label htmlFor="model-status" className="sr-only">
            Filter models
          </label>

          <select
            id="model-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ModelStatusFilter)}
            className={selectClassName}
          >
            {MODEL_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {showControls ? (
        <p aria-live="polite" className="sr-only">
          {visible.length} of {models.length} models shown
        </p>
      ) : null}

      {visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />

            <div className="font-medium">No models match your search</div>

            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different name or industry, or clear the filters to see every model again.
            </p>

            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((model) => (
            <ProjectCard
              key={model.id}
              project={{
                id: model.id,

                name: model.name,

                industry: model.industry,

                currency: model.currency,

                startMonth: model.startMonth,

                horizonMonths: model.horizonMonths,

                revenueMode: model.revenueMode,

                updatedAt: model.updatedAt,

                _count: {
                  scenarios: model.scenarioCount,
                },
              }}
              snapshot={model.snapshot}
              sharing={model.sharing ?? null}
              status={model.status}
              completedSections={model.completedSections}
            />
          ))}
        </div>
      )}
    </div>
  );
}
