import type {
  Metadata,
} from "next";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import {
  GeneralAssumptionsForm,
} from "@/components/assumptions/general-assumptions-form";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  countCompletedAssumptionSections,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  requireOwnedProject,
} from "@/lib/projects/project-access";

export const metadata: Metadata = {
  title: "Assumptions",
};

export default async function AssumptionsPage({
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

  const completed =
    countCompletedAssumptionSections(
      assumptions,
    );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Model
          </div>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Financial assumptions
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure the persistent inputs that will later
            feed the VentureScope financial engine.
          </p>
        </div>

        <Badge
          variant={
            completed === 3
              ? "default"
              : "outline"
          }
        >
          {completed}/3 sections configured
        </Badge>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SetupCard
          href={`/projects/${project.id}/assumptions`}
          title="General"
          description="Starting cash and tax."
          complete={
            assumptions.completion
              .general
          }
          icon={
            CircleDollarSign
          }
          current
        />

        <SetupCard
          href={`/projects/${project.id}/revenue`}
          title="Revenue"
          description={
            project.revenueMode ===
            "DIRECT"
              ? "Direct revenue model."
              : "Customer-driven model."
          }
          complete={
            assumptions.completion
              .revenue
          }
          icon={
            TrendingUp
          }
        />

        <SetupCard
          href={`/projects/${project.id}/expenses`}
          title="Expenses"
          description="COGS and operating costs."
          complete={
            assumptions.completion
              .expenses
          }
          icon={
            ReceiptText
          }
        />
      </section>

      <GeneralAssumptionsForm
        projectId={
          project.id
        }
        currency={
          project.currency
        }
        assumptions={
          assumptions.general
        }
      />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">
            Setup sequence
          </CardTitle>

          <CardDescription>
            Complete all three sections before the financial engine is introduced.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="outline"
          >
            <Link
              href={`/projects/${project.id}/revenue`}
            >
              Configure revenue

              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
          >
            <Link
              href={`/projects/${project.id}/expenses`}
            >
              Configure expenses

              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

type SetupCardProps = {
  href: string;
  title: string;
  description: string;
  complete: boolean;
  current?: boolean;
  icon: React.ComponentType<{
    className?: string;
  }>;
};

function SetupCard({
  href,
  title,
  description,
  complete,
  current = false,
  icon: Icon,
}: SetupCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full border-border/70 transition-colors hover:bg-muted/30">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Icon
              className="size-4"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-medium">
                {title}
              </div>

              {current ? (
                <Badge
                  variant="outline"
                  className="text-[9px]"
                >
                  CURRENT
                </Badge>
              ) : null}
            </div>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>

          {complete ? (
            <CheckCircle2
              className="size-5 shrink-0"
              aria-label="Configured"
            />
          ) : (
            <Circle
              className="size-5 shrink-0 text-muted-foreground"
              aria-label="Not configured"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
