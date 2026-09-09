import Link from "next/link";

import {
  cancelApprovalRequestAction,
  createApprovalRequestAction,
  decideApprovalRequestAction,
} from "@/app/(app)/projects/[projectId]/approvals/actions";

import {
  APPROVAL_REQUEST_STATUSES,
  APPROVAL_REQUEST_TYPES,
  type ApprovalRequestView,
  type ApprovalSummary,
} from "@/lib/approvals/types";


type Props = {
  projectId:
    string;

  currentUserId:
    string;

  canRequest:
    boolean;

  canDecide:
    boolean;

  summary:
    ApprovalSummary;

  requests:
    ApprovalRequestView[];

  filters: {
    status:
      string;

    requestType:
      string;

    query:
      string;
  };
};


function statusTone(
  status:
    string,
): string {
  switch (
    status
  ) {
    case "APPROVED":
      return "text-emerald-700 dark:text-emerald-400";

    case "REJECTED":
      return "text-destructive";

    case "PENDING":
      return "text-amber-700 dark:text-amber-400";

    case "CANCELLED":
      return "text-muted-foreground";

    default:
      return "";
  }
}


function requestTypeLabel(
  value:
    string,
): string {
  return value
    .toLowerCase()
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/gu,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}


function personLabel(
  value:
    string |
    null,
): string {
  return value ??
    "Unavailable";
}


export function ApprovalCenter({
  projectId,
  currentUserId,
  canRequest,
  canDecide,
  summary,
  requests,
  filters,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Requests
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.total
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending
          </p>

          <p className="mt-2 text-3xl font-semibold text-amber-700 dark:text-amber-400">
            {
              summary.pending
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Approved
          </p>

          <p className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-400">
            {
              summary.approved
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Rejected
          </p>

          <p className="mt-2 text-3xl font-semibold text-destructive">
            {
              summary.rejected
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cancelled
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.cancelled
            }
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="text-lg font-semibold">
          Approval governance
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Editors and Owners may submit governance requests. Only Workspace Owners may approve or reject requests, and an Owner cannot approve their own request. Decisions are terminal and recorded in the immutable Project Audit Trail.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Viewer
            </p>

            <p className="mt-2 text-sm font-semibold">
              Read approval history
            </p>
          </article>

          <article className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Editor
            </p>

            <p className="mt-2 text-sm font-semibold">
              Create governance requests
            </p>
          </article>

          <article className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Owner
            </p>

            <p className="mt-2 text-sm font-semibold">
              Request + decide others&apos; requests
            </p>
          </article>
        </div>
      </section>

      {
        canRequest
          ?
            (
              <section className="rounded-xl border bg-background p-5 sm:p-6">
                <h2 className="text-lg font-semibold">
                  New governance request
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Request approval before a significant model, risk, reporting, close, capital, KPI, or data-governance decision.
                </p>

                <form
                  action={
                    createApprovalRequestAction
                  }
                  className="mt-5 grid gap-4 sm:grid-cols-2"
                >
                  <input
                    type="hidden"
                    name="projectId"
                    value={
                      projectId
                    }
                  />

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Request type
                    </span>

                    <select
                      required
                      name="requestType"
                      defaultValue="MODEL_CHANGE"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      {
                        APPROVAL_REQUEST_TYPES.map(
                          (
                            type,
                          ) => (
                            <option
                              key={
                                type
                              }
                              value={
                                type
                              }
                            >
                              {
                                requestTypeLabel(
                                  type,
                                )
                              }
                            </option>
                          ),
                        )
                      }
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Title
                    </span>

                    <input
                      required
                      minLength={
                        5
                      }
                      maxLength={
                        160
                      }
                      name="title"
                      placeholder="Approve downside funding strategy"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Subject type
                    </span>

                    <input
                      name="subjectType"
                      maxLength={
                        120
                      }
                      placeholder="CapitalPlan"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Subject ID / reference
                    </span>

                    <input
                      name="subjectId"
                      maxLength={
                        120
                      }
                      placeholder="Optional entity or period reference"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium">
                      Request rationale
                    </span>

                    <textarea
                      rows={
                        5
                      }
                      maxLength={
                        3000
                      }
                      name="description"
                      placeholder="Explain what management is asking to approve, why the decision is needed, and the expected implications."
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
                    >
                      Submit approval request
                    </button>
                  </div>
                </form>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                Viewer access includes the approval register, but creating a governance request requires Editor permission.
              </section>
            )
      }

      <section className="rounded-xl border bg-background p-5">
        <h2 className="text-lg font-semibold">
          Approval filters
        </h2>

        <form
          method="get"
          className="mt-5 grid gap-4 md:grid-cols-3"
        >
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Status
            </span>

            <select
              name="approvalStatus"
              defaultValue={
                filters.status
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All statuses
              </option>

              {
                APPROVAL_REQUEST_STATUSES.map(
                  (
                    status,
                  ) => (
                    <option
                      key={
                        status
                      }
                      value={
                        status
                      }
                    >
                      {
                        status
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Request type
            </span>

            <select
              name="requestType"
              defaultValue={
                filters.requestType
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All types
              </option>

              {
                APPROVAL_REQUEST_TYPES.map(
                  (
                    type,
                  ) => (
                    <option
                      key={
                        type
                      }
                      value={
                        type
                      }
                    >
                      {
                        requestTypeLabel(
                          type,
                        )
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Search
            </span>

            <input
              name="q"
              defaultValue={
                filters.query
              }
              placeholder="Title or description"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <div className="flex flex-wrap gap-2 md:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Apply
            </button>

            <a
              href="?"
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Clear
            </a>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Governance approval register
          </h2>

          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            Terminal APPROVED, REJECTED, and CANCELLED requests remain in the register as governance evidence. Approval itself does not execute the underlying business change.
          </p>
        </div>

        {
          requests.length ===
          0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No approval requests match the selected filters.
                </div>
              )
            :
              (
                <div className="divide-y">
                  {
                    requests.map(
                      (
                        request,
                      ) => {
                        const isRequester =
                          request.requestedByUserId ===
                          currentUserId;


                        const mayDecide =
                          canDecide &&
                          request.status ===
                            "PENDING" &&
                          !isRequester;


                        const mayCancel =
                          request.status ===
                            "PENDING" &&
                          isRequester;


                        return (
                          <article
                            key={
                              request.id
                            }
                            className="p-5"
                          >
                            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                              <div className="max-w-4xl">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-xs font-semibold ${statusTone(
                                    request.status,
                                  )}`}>
                                    {
                                      request.status
                                    }
                                  </span>

                                  <span className="rounded border px-2 py-1 text-[10px] font-medium">
                                    {
                                      requestTypeLabel(
                                        request.requestType,
                                      )
                                    }
                                  </span>

                                  {
                                    isRequester
                                      ?
                                        (
                                          <span className="rounded border px-2 py-1 text-[10px]">
                                            YOUR REQUEST
                                          </span>
                                        )
                                      :
                                        null
                                  }
                                </div>

                                <h3 className="mt-3 text-lg font-semibold">
                                  {
                                    request.title
                                  }
                                </h3>

                                {
                                  request.description
                                    ?
                                      (
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                          {
                                            request.description
                                          }
                                        </p>
                                      )
                                    :
                                      null
                                }

                                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Requested by
                                    </dt>

                                    <dd className="mt-1 font-medium">
                                      {
                                        personLabel(
                                          request.requesterLabel,
                                        )
                                      }
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Requested
                                    </dt>

                                    <dd className="mt-1">
                                      {
                                        new Date(
                                          request.requestedAt,
                                        ).toLocaleString()
                                      }
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Subject
                                    </dt>

                                    <dd className="mt-1">
                                      {
                                        request.subjectType ??
                                        "—"
                                      }
                                      {
                                        request.subjectId
                                          ?
                                            ` · ${request.subjectId}`
                                          :
                                            ""
                                      }
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Decided by
                                    </dt>

                                    <dd className="mt-1">
                                      {
                                        request.deciderLabel ??
                                        "—"
                                      }
                                    </dd>
                                  </div>
                                </dl>

                                {
                                  request.decisionNote
                                    ?
                                      (
                                        <div className="mt-4 rounded-lg border p-4">
                                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Decision rationale
                                          </p>

                                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                                            {
                                              request.decisionNote
                                            }
                                          </p>
                                        </div>
                                      )
                                    :
                                      null
                                }
                              </div>

                              {
                                request.status ===
                                "PENDING"
                                  ?
                                    (
                                      <div className="min-w-full space-y-3 xl:min-w-[360px] xl:max-w-[360px]">
                                        {
                                          isRequester &&
                                          canDecide
                                            ?
                                              (
                                                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                                                  Separation of duties prevents you from approving or rejecting your own request.
                                                </div>
                                              )
                                            :
                                              null
                                        }

                                        {
                                          mayDecide
                                            ?
                                              (
                                                <>
                                                  <form
                                                    action={
                                                      decideApprovalRequestAction
                                                    }
                                                    className="space-y-2 rounded-lg border p-3"
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
                                                      name="requestId"
                                                      value={
                                                        request.id
                                                      }
                                                    />

                                                    <input
                                                      type="hidden"
                                                      name="decision"
                                                      value="APPROVE"
                                                    />

                                                    <textarea
                                                      required
                                                      minLength={
                                                        5
                                                      }
                                                      maxLength={
                                                        2000
                                                      }
                                                      rows={
                                                        3
                                                      }
                                                      name="decisionNote"
                                                      placeholder="Required approval rationale"
                                                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs"
                                                    />

                                                    <button
                                                      type="submit"
                                                      className="rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background"
                                                    >
                                                      Approve request
                                                    </button>
                                                  </form>

                                                  <form
                                                    action={
                                                      decideApprovalRequestAction
                                                    }
                                                    className="space-y-2 rounded-lg border p-3"
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
                                                      name="requestId"
                                                      value={
                                                        request.id
                                                      }
                                                    />

                                                    <input
                                                      type="hidden"
                                                      name="decision"
                                                      value="REJECT"
                                                    />

                                                    <textarea
                                                      required
                                                      minLength={
                                                        5
                                                      }
                                                      maxLength={
                                                        2000
                                                      }
                                                      rows={
                                                        3
                                                      }
                                                      name="decisionNote"
                                                      placeholder="Required rejection rationale"
                                                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs"
                                                    />

                                                    <button
                                                      type="submit"
                                                      className="rounded-lg border px-3 py-2 text-xs font-medium text-destructive"
                                                    >
                                                      Reject request
                                                    </button>
                                                  </form>
                                                </>
                                              )
                                            :
                                              null
                                        }

                                        {
                                          mayCancel
                                            ?
                                              (
                                                <form
                                                  action={
                                                    cancelApprovalRequestAction
                                                  }
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
                                                    name="requestId"
                                                    value={
                                                      request.id
                                                    }
                                                  />

                                                  <button
                                                    type="submit"
                                                    className="rounded-lg border px-3 py-2 text-xs font-medium"
                                                  >
                                                    Cancel my request
                                                  </button>
                                                </form>
                                              )
                                            :
                                              null
                                        }
                                      </div>
                                    )
                                  :
                                    null
                              }
                            </div>
                          </article>
                        );
                      },
                    )
                  }
                </div>
              )
        }
      </section>

      <section className="flex flex-wrap gap-2 rounded-xl border bg-muted/20 p-5">
        <Link
          href={`/projects/${projectId}/activity`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Activity Center
        </Link>

        <Link
          href={`/projects/${projectId}/alerts`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Alert Inbox
        </Link>

        <Link
          href={`/projects/${projectId}/decision-center`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Decision Center
        </Link>

        <Link
          href={`/projects/${projectId}/period-close`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Financial Close
        </Link>

        <Link
          href={`/projects/${projectId}/board-room`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Board Room
        </Link>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Approval integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          An APPROVED request records management authorization; it does not automatically modify the financial model or execute another workflow. Forecast changes, risk-policy updates, financial-period reopening, KPI changes, capital decisions, and imports remain governed by their own authoritative services. This prevents approval records from becoming an uncontrolled backdoor around existing domain security.
        </p>
      </section>
    </div>
  );
}
