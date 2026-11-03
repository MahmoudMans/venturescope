import {
  closeFinancialPeriodAction,
  reopenFinancialPeriodAction,
} from "@/app/(app)/projects/[projectId]/period-close/actions";

import {
  PendingButton,
} from "@/components/forms/pending-button";

import { ScrollRegion } from "@/components/ui/scroll-region";
import type {
  FinancialPeriodEventView,
  FinancialPeriodRegister,
} from "@/lib/finance/period-close/types";


type Props = {
  projectId:
    string;

  currency:
    string;

  editable:
    boolean;

  owner:
    boolean;

  register:
    FinancialPeriodRegister;

  events:
    FinancialPeriodEventView[];
};


function money(
  value:
    number |
    null,
  currency:
    string,
): string {
  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    )
  ) {
    return "—";
  }


  return new Intl.NumberFormat(
    "en",
    {
      style:
        "currency",

      currency,

      notation:
        Math.abs(
          value,
        ) >=
        1_000_000
          ?
            "compact"
          :
            "standard",

      maximumFractionDigits:
        1,
    },
  ).format(
    value,
  );
}


function actorLabel(
  actorUserId:
    string |
    null,
): string {
  if (
    !actorUserId
  ) {
    return "—";
  }


  return actorUserId.length >
    18
    ?
      `${actorUserId.slice(
        0,
        8,
      )}…${actorUserId.slice(
        -6,
      )}`
    :
      actorUserId;
}


export function PeriodCloseWorkspace({
  projectId,
  currency,
  editable,
  owner,
  register,
  events,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Actual periods
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              register.summary
                .totalPeriods
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Open
          </p>

          <p className="mt-2 text-3xl font-semibold text-warning">
            {
              register.summary
                .openPeriods
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Closed
          </p>

          <p className="mt-2 text-3xl font-semibold text-success">
            {
              register.summary
                .closedPeriods
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Close cycles
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              register.summary
                .closeCycles
            }
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="text-lg font-semibold">
          Financial close governance
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Closing a month prevents Actual-period INSERT, UPDATE, and DELETE operations at the PostgreSQL database boundary. Editors and Owners may close periods. Only Workspace Owners may reopen them.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Viewer
            </p>

            <p className="mt-2 text-sm font-semibold">
              Read financial-close status
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Editor
            </p>

            <p className="mt-2 text-sm font-semibold">
              Close open periods
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Owner
            </p>

            <p className="mt-2 text-sm font-semibold">
              Close + deliberately reopen
            </p>
          </div>
        </div>
      </section>

      {
        register.rows.length ===
        0
          ?
            (
              <section className="rounded-xl border border-dashed p-8">
                <h2 className="font-semibold">
                  No Actual periods to close
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Import Actuals before starting the financial-close process.
                </p>
              </section>
            )
          :
            (
              <section className="overflow-hidden rounded-xl border bg-background">
                <div className="border-b p-5">
                  <h2 className="text-lg font-semibold">
                    Financial-period register
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                    CLOSED periods are immutable until an Owner explicitly reopens them.
                  </p>
                </div>

                <ScrollRegion label="Financial-period register">
                  <table className="w-full min-w-[1400px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Period
                        </th>

                        <th className="px-4 py-3 text-left">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right">
                          Revenue
                        </th>

                        <th className="px-4 py-3 text-right">
                          EBITDA
                        </th>

                        <th className="px-4 py-3 text-right">
                          Cash
                        </th>

                        <th className="px-4 py-3 text-right">
                          Close cycle
                        </th>

                        <th className="px-4 py-3 text-left">
                          Closed
                        </th>

                        <th className="px-4 py-3 text-left">
                          Reopened
                        </th>

                        <th className="px-4 py-3 text-left">
                          Governance action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        register.rows.map(
                          (
                            row,
                          ) => (
                            <tr
                              key={
                                row.periodKey
                              }
                              className="border-b align-top last:border-0"
                            >
                              <th className="px-4 py-3 text-left">
                                {
                                  row.periodKey
                                }
                              </th>

                              <td className={`px-4 py-3 font-semibold ${
                                row.status ===
                                  "CLOSED"
                                  ?
                                    "text-success"
                                  :
                                    "text-warning"
                              }`}>
                                {
                                  row.status
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  money(
                                    row.revenue,
                                    currency,
                                  )
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  money(
                                    row.ebitda,
                                    currency,
                                  )
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  money(
                                    row.cashBalance,
                                    currency,
                                  )
                                }
                              </td>

                              <td className="px-4 py-3 text-right">
                                {
                                  row.closeSequence
                                }
                              </td>

                              <td className="px-4 py-3 text-xs">
                                {
                                  row.closedAt
                                    ?
                                      (
                                        <>
                                          <p>
                                            {
                                              new Date(
                                                row.closedAt,
                                              ).toLocaleString()
                                            }
                                          </p>

                                          <p className="mt-1 text-muted-foreground">
                                            {
                                              actorLabel(
                                                row.closedByUserId,
                                              )
                                            }
                                          </p>
                                        </>
                                      )
                                    :
                                      "—"
                                }
                              </td>

                              <td className="px-4 py-3 text-xs">
                                {
                                  row.reopenedAt
                                    ?
                                      (
                                        <>
                                          <p>
                                            {
                                              new Date(
                                                row.reopenedAt,
                                              ).toLocaleString()
                                            }
                                          </p>

                                          <p className="mt-1 text-muted-foreground">
                                            {
                                              actorLabel(
                                                row.reopenedByUserId,
                                              )
                                            }
                                          </p>
                                        </>
                                      )
                                    :
                                      "—"
                                }
                              </td>

                              <td className="min-w-[360px] px-4 py-3">
                                {
                                  row.status ===
                                    "OPEN"
                                    ?
                                      editable
                                        ?
                                          (
                                            <form
                                              action={
                                                closeFinancialPeriodAction
                                              }
                                              className="space-y-2"
                                            >
                                              <input
                                                type="hidden"
                                                name="projectId"
                                                value={
                                                  projectId
                                                }
                                              />

                                              <input
                                                type="hidden"
                                                name="periodKey"
                                                value={
                                                  row.periodKey
                                                }
                                              />

                                              <input
                                                required
                                                name="confirmation"
                                                placeholder={`CLOSE ${row.periodKey}`}
                                                aria-label={`Type CLOSE ${row.periodKey} to confirm`}
                                                className="h-9 w-full rounded-lg border bg-background px-3 text-xs"
                                              />

                                              <input
                                                name="reason"
                                                maxLength={
                                                  1000
                                                }
                                                placeholder="Optional close note"
                                                aria-label="Optional close note"
                                                className="h-9 w-full rounded-lg border bg-background px-3 text-xs"
                                              />

                                              <PendingButton
                                                className="rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background"
                                              >
                                                Close period
                                              </PendingButton>
                                            </form>
                                          )
                                        :
                                          (
                                            <span className="text-xs text-muted-foreground">
                                              Editor permission required.
                                            </span>
                                          )
                                    :
                                      owner
                                        ?
                                          (
                                            <form
                                              action={
                                                reopenFinancialPeriodAction
                                              }
                                              className="space-y-2"
                                            >
                                              <input
                                                type="hidden"
                                                name="projectId"
                                                value={
                                                  projectId
                                                }
                                              />

                                              <input
                                                type="hidden"
                                                name="periodKey"
                                                value={
                                                  row.periodKey
                                                }
                                              />

                                              <input
                                                required
                                                name="confirmation"
                                                placeholder={`REOPEN ${row.periodKey}`}
                                                aria-label={`Type REOPEN ${row.periodKey} to confirm`}
                                                className="h-9 w-full rounded-lg border bg-background px-3 text-xs"
                                              />

                                              <textarea
                                                required
                                                minLength={
                                                  5
                                                }
                                                maxLength={
                                                  1000
                                                }
                                                rows={
                                                  2
                                                }
                                                name="reason"
                                                placeholder="Required reason for reopening this closed month"
                                                aria-label="Reason for reopening this closed month"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-xs"
                                              />

                                              <PendingButton
                                                className="rounded-lg border px-3 py-2 text-xs font-medium text-destructive"
                                              >
                                                Reopen period
                                              </PendingButton>
                                            </form>
                                          )
                                        :
                                          (
                                            <span className="text-xs text-muted-foreground">
                                              Workspace Owner permission is required to reopen this period.
                                            </span>
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
              </section>
            )
      }

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Financial-close audit history
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Close and reopen events are append-only and remain visible across repeated close cycles.
          </p>
        </div>

        {
          events.length ===
          0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No financial-close events have been recorded yet.
                </div>
              )
            :
              (
                <ScrollRegion label="Financial-close audit history">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Time
                        </th>

                        <th className="px-4 py-3 text-left">
                          Period
                        </th>

                        <th className="px-4 py-3 text-left">
                          Event
                        </th>

                        <th className="px-4 py-3 text-right">
                          Cycle
                        </th>

                        <th className="px-4 py-3 text-left">
                          Actor
                        </th>

                        <th className="px-4 py-3 text-left">
                          Reason
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
                              className="border-b align-top last:border-0"
                            >
                              <td className="px-4 py-3 text-xs">
                                {
                                  new Date(
                                    event.createdAt,
                                  ).toLocaleString()
                                }
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {
                                  event.periodKey
                                }
                              </td>

                              <td className={`px-4 py-3 font-semibold ${
                                event.action ===
                                  "CLOSED"
                                  ?
                                    "text-success"
                                  :
                                    "text-destructive"
                              }`}>
                                {
                                  event.action
                                }
                              </td>

                              <td className="px-4 py-3 text-right">
                                {
                                  event.sequence
                                }
                              </td>

                              <td className="px-4 py-3 font-mono text-xs">
                                {
                                  actorLabel(
                                    event.actorUserId,
                                  )
                                }
                              </td>

                              <td className="max-w-lg px-4 py-3 text-xs leading-5 text-muted-foreground">
                                {
                                  event.reason ??
                                  "—"
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
          Close integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Financial close does not copy or rewrite Actuals. A CLOSED period remains the same ActualPeriod record, but PostgreSQL rejects INSERT, UPDATE, and DELETE attempts for that project and month until an Owner deliberately reopens it.
        </p>
      </section>
    </div>
  );
}
