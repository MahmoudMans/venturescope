import type {
  Metadata,
} from "next";

import {
  RevenueAssumptionsForm,
} from "@/components/assumptions/revenue-assumptions-form";
import {
  Badge,
} from "@/components/ui/badge";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  requireOwnedProject,
} from "@/lib/projects/project-access";
import {
  formatRevenueMode,
} from "@/lib/projects/project-formatting";

export const metadata: Metadata = {
  title: "Revenue assumptions",
};

export default async function RevenuePage({
  params,
}: {
  params: Promise<{
    projectId: string;
  }>;
}) {
  const {
    projectId,
  } = await params;

  const user =
    await requireUser();

  const project =
    await requireOwnedProject(
      user.id,
      projectId,
    );

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Model
          </div>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Revenue assumptions
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure the revenue inputs for this model.
            These values are persisted now and calculated
            only when the financial engine is introduced.
          </p>
        </div>

        <Badge variant="outline">
          {formatRevenueMode(
            project.revenueMode,
          )}
        </Badge>
      </section>

      <RevenueAssumptionsForm
        projectId={
          project.id
        }
        currency={
          project.currency
        }
        revenueMode={
          project.revenueMode
        }
        directAssumptions={
          assumptions.directRevenue
        }
        customerAssumptions={
          assumptions.customerRevenue
        }
        marketingMonthlyAmount={
          assumptions.expenses
            .marketing
            .monthlyAmount
        }
      />
    </div>
  );
}
