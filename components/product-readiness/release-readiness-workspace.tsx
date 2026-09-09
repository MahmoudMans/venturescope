import Link from "next/link";

import {
  FINAL_RELEASE_CHECKLIST,
  PORTFOLIO_STORYBOARD,
  PRODUCT_CAPABILITIES,
  PRODUCT_GOVERNANCE_CONTROLS,
} from "@/lib/product-readiness/catalog";

import {
  buildProductReadinessSummary,
} from "@/lib/product-readiness/calculations";


type Props = {
  projectId:
    string;

  projectName:
    string;

  industry:
    string;

  currency:
    string;

  modelVersion:
    string;
};


export function ReleaseReadinessWorkspace({
  projectId,
  projectName,
  industry,
  currency,
  modelVersion,
}: Props) {
  const summary =
    buildProductReadinessSummary();


  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Portfolio release candidate
        </p>

        <div className="mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-2xl font-semibold">
              {
                projectName
              }
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {
                industry ||
                "Industry not specified"
              }
              {" · "}
              {
                currency
              }
              {" · Model "}
              {
                modelVersion
              }
            </p>
          </div>

          <div className="rounded-xl border px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Product status
            </p>

            <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              {
                summary.status
              }
            </p>
          </div>
        </div>

        <p className="mt-5 max-w-5xl text-sm leading-6 text-muted-foreground">
          This page is the portfolio-facing evidence layer for VentureScope. It summarizes implemented product capabilities and architecture controls. The actual release decision remains governed by the complete command-line release gate rather than this presentation surface.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Capabilities
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.capabilityCount
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Governance controls
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.governanceControlCount
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Migrations
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.migrationCount
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Release stages
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.releaseStageCount
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Portfolio captures
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              summary.storyboardCount
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Paid APIs required
          </p>

          <p className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-400">
            {
              summary.paidApiCount
            }
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">
            Product capability map
          </h2>

          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            The complete application story, grouped into the financial, management, governance, portfolio, data, and production layers.
          </p>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-3">
          {
            PRODUCT_CAPABILITIES.map(
              (
                capability,
              ) => (
                <article
                  key={
                    capability.id
                  }
                  className="bg-background p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {
                          capability.domain
                        }
                      </p>

                      <h3 className="mt-1 text-lg font-semibold">
                        {
                          capability.title
                        }
                      </h3>
                    </div>

                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {
                        capability.status
                      }
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {
                      capability.summary
                    }
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {
                      capability.evidence.map(
                        (
                          evidence,
                        ) => (
                          <span
                            key={
                              evidence
                            }
                            className="rounded border px-2 py-1 text-xs"
                          >
                            {
                              evidence
                            }
                          </span>
                        ),
                      )
                    }
                  </div>

                  <Link
                    href={`/projects/${projectId}${capability.routeSuffix}`}
                    className="mt-5 inline-flex rounded-lg border px-3 py-2 text-sm font-medium"
                  >
                    Open capability
                  </Link>
                </article>
              ),
            )
          }
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">
            Governance &amp; architecture controls
          </h2>

          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            Controls that make VentureScope more than a collection of financial dashboards.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left">
                  Control
                </th>

                <th className="px-4 py-3 text-left">
                  Boundary
                </th>

                <th className="px-4 py-3 text-left">
                  Implementation
                </th>

                <th className="px-4 py-3 text-left">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {
                PRODUCT_GOVERNANCE_CONTROLS.map(
                  (
                    control,
                  ) => (
                    <tr
                      key={
                        control.id
                      }
                      className="border-b align-top last:border-0"
                    >
                      <th className="px-4 py-3 text-left">
                        {
                          control.title
                        }
                      </th>

                      <td className="max-w-md px-4 py-3 leading-6 text-muted-foreground">
                        {
                          control.boundary
                        }
                      </td>

                      <td className="max-w-md px-4 py-3 leading-6">
                        {
                          control.implementation
                        }
                      </td>

                      <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">
                        {
                          control.status
                        }
                      </td>
                    </tr>
                  ),
                )
              }
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-background">
        <div className="border-b p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Portfolio presentation
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Screenshot storyboard
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Capture these screens in order to explain the application visually without needing the viewer to understand the entire product first.
          </p>
        </div>

        <div className="divide-y">
          {
            PORTFOLIO_STORYBOARD
              .slice()
              .sort(
                (
                  left,
                  right,
                ) =>
                  left.order -
                  right.order,
              )
              .map(
                (
                  item,
                ) => (
                  <article
                    key={
                      item.id
                    }
                    className="grid gap-4 p-5 md:grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border font-semibold">
                      {
                        item.order
                      }
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {
                          item.title
                        }
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {
                          item.portfolioMessage
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {
                        item.captureFocus.map(
                          (
                            focus,
                          ) => (
                            <span
                              key={
                                focus
                              }
                              className="rounded border px-2 py-1 text-xs"
                            >
                              {
                                focus
                              }
                            </span>
                          ),
                        )
                      }
                    </div>

                    <Link
                      href={`/projects/${projectId}${item.routeSuffix}`}
                      className="rounded-lg border px-3 py-2 text-center text-sm font-medium"
                    >
                      Open screen
                    </Link>
                  </article>
                ),
              )
          }
        </div>
      </section>

      <section className="rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">
            Final release checklist
          </h2>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-2">
          {
            FINAL_RELEASE_CHECKLIST.map(
              (
                item,
              ) => (
                <article
                  key={
                    item.id
                  }
                  className="bg-background p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold">
                      {
                        item.title
                      }
                    </h3>

                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {
                        item.status
                      }
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {
                      item.description
                    }
                  </p>
                </article>
              ),
            )
          }
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Authoritative release rule
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          This interface documents product scope; it does not certify its own release. The authoritative result is the complete 37-stage release gate executed from the repository, including migration deployment from an empty database, schema-drift verification, linting, TypeScript, automated tests, browser security checks, production build, and production Docker validation.
        </p>

        <div className="mt-4 inline-flex rounded-lg border bg-background px-4 py-3 font-mono text-sm">
          pnpm release:gate
        </div>
      </section>
    </div>
  );
}
