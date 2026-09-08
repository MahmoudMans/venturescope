import type {
  Metadata,
} from "next";

import {
  ExpenseAssumptionsForm,
} from "@/components/assumptions/expense-assumptions-form";
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

export const metadata: Metadata = {
  title: "Expense assumptions",
};

export default async function ExpensesPage({
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

  const customCount =
    assumptions.expenses
      .operatingExpenses
      .custom.length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Model
          </div>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Expense assumptions
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure payroll, rent, marketing, COGS and
            recurring operating expenses.
          </p>
        </div>

        <Badge variant="outline">
          {customCount} custom{" "}
          {customCount ===
          1
            ? "category"
            : "categories"}
        </Badge>
      </section>

      <ExpenseAssumptionsForm
        projectId={
          project.id
        }
        currency={
          project.currency
        }
        assumptions={
          assumptions.expenses
        }
      />
    </div>
  );
}
