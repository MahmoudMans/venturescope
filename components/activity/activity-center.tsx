import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  PROJECT_AUDIT_CATEGORIES,
  PROJECT_AUDIT_SEVERITIES,
  type ProjectAuditEventView,
  type ProjectActivitySummary,
} from "@/lib/audit/types";

import {
  PROJECT_AUDIT_CATEGORY_LABELS,
} from "@/lib/audit/catalog";

import {
  summarizeProjectAuditMetadata,
} from "@/lib/audit/metadata";


type Props = {
  projectId:
    string;

  events:
    ProjectAuditEventView[];

  summary:
    ProjectActivitySummary;

  filters: {
    category:
      string;

    severity:
      string;

    action:
      string;

    actor:
      string;

    query:
      string;
  };
};


function severityTone(
  severity:
    string,
): string {
  switch (
    severity
  ) {
    case "CRITICAL":
      return "text-destructive";

    case "WARNING":
      return "text-warning";

    default:
      return "text-muted-foreground";
  }
}


function severitySurface(
  severity:
    string,
): string {
  switch (
    severity
  ) {
    case "CRITICAL":
      return "bg-destructive/5";

    case "WARNING":
      return "bg-warning/5";

    default:
      return "";
  }
}


function formatUtc(
  iso:
    string,
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle:
        "medium",

      timeStyle:
        "medium",

      timeZone:
        "UTC",
    },
  ).format(
    new Date(
      iso,
    ),
  );
}


export function ActivityCenter({
  events,
  summary,
  filters,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Audit events
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.total
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Information
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.info
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Warning
          </p>

          <p className="mt-2 text-3xl font-semibold text-warning">
            {
              summary.warning
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Critical
          </p>

          <p className={`mt-2 text-3xl font-semibold ${
            summary.critical >
            0
              ?
                "text-destructive"
              :
                ""
          }`}>
            {
              summary.critical
            }
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="text-lg font-semibold">
          Audit filters
        </h2>

        <form
          method="get"
          className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          <label className="space-y-2">
            <span className="text-xs font-medium">
              Category
            </span>

            <select
              name="category"
              defaultValue={
                filters.category
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All categories
              </option>

              {
                PROJECT_AUDIT_CATEGORIES.map(
                  (
                    category,
                  ) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {
                        PROJECT_AUDIT_CATEGORY_LABELS[
                          category
                        ]
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium">
              Severity
            </span>

            <select
              name="severity"
              defaultValue={
                filters.severity
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All severities
              </option>

              {
                PROJECT_AUDIT_SEVERITIES.map(
                  (
                    severity,
                  ) => (
                    <option
                      key={
                        severity
                      }
                      value={
                        severity
                      }
                    >
                      {
                        severity
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium">
              Action
            </span>

            <input
              name="action"
              defaultValue={
                filters.action
              }
              placeholder="KPI_TARGET"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium">
              Actor
            </span>

            <input
              name="actor"
              defaultValue={
                filters.actor
              }
              placeholder="User ID"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium">
              Search
            </span>

            <input
              name="q"
              defaultValue={
                filters.query
              }
              placeholder="summary or entity"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-5">
            <button
              type="submit"
              className="touch-target rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Apply filters
            </button>

            <a
              href="?"
              className="touch-link rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Clear
            </a>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Project audit ledger
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Showing up to the 250 most recent events matching the current filters. Audit entries are append-only and cannot be edited or deleted.
          </p>
        </div>

        {
          events.length ===
          0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No audit events match the selected filters.
                </div>
              )
            :
              (
                <ScrollRegion label="Project audit ledger">
                  <table className="w-full min-w-[1450px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          UTC time
                        </th>

                        <th className="px-4 py-3 text-left">
                          Severity
                        </th>

                        <th className="px-4 py-3 text-left">
                          Category
                        </th>

                        <th className="px-4 py-3 text-left">
                          Action
                        </th>

                        <th className="px-4 py-3 text-left">
                          Summary
                        </th>

                        <th className="px-4 py-3 text-left">
                          Actor
                        </th>

                        <th className="px-4 py-3 text-left">
                          Entity
                        </th>

                        <th className="px-4 py-3 text-left">
                          Metadata
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        events.map(
                          (
                            event,
                          ) => (
                            <tr
                              key={
                                event.id
                              }
                              className={`border-b align-top last:border-0 ${severitySurface(
                                event.severity,
                              )}`}
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-xs">
                                {
                                  formatUtc(
                                    event.createdAt,
                                  )
                                }
                              </td>

                              <td className={`px-4 py-3 font-semibold ${severityTone(
                                event.severity,
                              )}`}>
                                {
                                  event.severity
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  PROJECT_AUDIT_CATEGORY_LABELS[
                                    event.category
                                  ]
                                }
                              </td>

                              <td className="px-4 py-3 font-mono text-xs">
                                {
                                  event.action
                                }
                              </td>

                              <td className="max-w-lg px-4 py-3">
                                {
                                  event.summary
                                }
                              </td>

                              <td className="max-w-xs px-4 py-3">
                                <p>
                                  {
                                    event.actorLabel ??
                                    "System / unavailable"
                                  }
                                </p>

                                {
                                  event.actorUserId
                                    ?
                                      (
                                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                          {
                                            event.actorUserId
                                          }
                                        </p>
                                      )
                                    :
                                      null
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  event.entityType
                                    ?
                                      (
                                        <>
                                          <p className="text-xs font-medium">
                                            {
                                              event.entityType
                                            }
                                          </p>

                                          {
                                            event.entityId
                                              ?
                                                (
                                                  <p className="mt-1 max-w-[180px] truncate font-mono text-[11px] text-muted-foreground">
                                                    {
                                                      event.entityId
                                                    }
                                                  </p>
                                                )
                                              :
                                                null
                                          }
                                        </>
                                      )
                                    :
                                      "—"
                                }
                              </td>

                              <td className="max-w-xl px-4 py-3 font-mono text-[11px] leading-5 text-muted-foreground">
                                {
                                  summarizeProjectAuditMetadata(
                                    event.metadata,
                                  )
                                }
                              </td>
                            </tr>
                          ),
                        )
                      }
                    </tbody>
                  </table>
                </ScrollRegion>
              )
        }
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Audit integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          The Activity Center is read-only. ProjectAuditEvent rows are protected by a PostgreSQL trigger that rejects UPDATE and DELETE operations. Actor IDs and project IDs are stored as immutable evidence instead of cascading relations, so historical audit evidence is not silently rewritten when an account or project is later removed.
        </p>
      </section>
    </div>
  );
}
