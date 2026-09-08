import {
  Banknote,
  CircleDollarSign,
  SlidersHorizontal,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";
import {
  formatLongMonthKey,
} from "@/lib/finance/formatting";

export type PlanningTimelineItem = {
  id: string;

  month: string;

  kind:
    | "OVERRIDE"
    | "FINANCING";

  title: string;

  detail: string;

  scope?: string;

  note?: string | null;
};

export function PlanningTimeline({
  items,
}: {
  items: PlanningTimelineItem[];
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <CircleDollarSign
          className="mx-auto size-8 text-muted-foreground"
          aria-hidden="true"
        />

        <div className="mt-4 font-medium">
          No timeline events yet
        </div>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Financing events and monthly planning overrides will appear here in chronological order.
        </p>
      </div>
    );
  }

  const groups =
    new Map<
      string,
      PlanningTimelineItem[]
    >();

  for (
    const item
    of items
  ) {
    const existing =
      groups.get(
        item.month,
      ) ??
      [];

    existing.push(
      item,
    );

    groups.set(
      item.month,
      existing,
    );
  }

  return (
    <div className="space-y-0">
      {Array.from(
        groups.entries(),
      ).map(
        (
          [
            month,
            monthItems,
          ],
          groupIndex,
        ) => (
          <div
            key={
              month
            }
            className="grid grid-cols-[24px_minmax(0,1fr)] gap-4"
          >
            <div className="relative flex justify-center">
              <div className="mt-2 size-3 rounded-full border-2 border-background bg-foreground ring-1 ring-border" />

              {groupIndex <
              groups.size -
                1 ? (
                <div className="absolute bottom-0 top-5 w-px bg-border" />
              ) : null}
            </div>

            <div className="pb-8">
              <div className="mb-3 text-sm font-semibold">
                {formatLongMonthKey(
                  month,
                )}
              </div>

              <div className="space-y-3">
                {monthItems.map(
                  (
                    item,
                  ) => {
                    const Icon =
                      item.kind ===
                      "FINANCING"
                        ? Banknote
                        : SlidersHorizontal;

                    return (
                      <div
                        key={
                          item.id
                        }
                        className="rounded-xl border bg-background p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <Icon
                              className="size-4"
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-medium">
                                {
                                  item.title
                                }
                              </div>

                              <Badge
                                variant="outline"
                              >
                                {
                                  item.kind ===
                                  "FINANCING"
                                    ? "FINANCING"
                                    : "OVERRIDE"
                                }
                              </Badge>

                              {item.scope ? (
                                <Badge
                                  variant="secondary"
                                >
                                  {
                                    item.scope
                                  }
                                </Badge>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {
                                item.detail
                              }
                            </p>

                            {item.note ? (
                              <p className="mt-3 border-t pt-3 text-xs leading-5 text-muted-foreground">
                                {
                                  item.note
                                }
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
