import type {
  Metadata,
} from "next";
import {
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

import {
  CreateProjectWizard,
} from "@/components/projects/create-project-wizard";
import {
  ImportModelForm,
} from "@/components/projects/import-model-form";
import {
  SampleModelForm,
} from "@/components/projects/sample-model-form";
import {
  Button,
} from "@/components/ui/button";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  dateToMonthInput,
} from "@/lib/projects/project-dates";

export const metadata: Metadata = {
  title: "Create financial model",
};

export default async function NewProjectPage() {
  await requireUser();

  const defaultStartMonth =
    dateToMonthInput(
      new Date(),
    );

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-10">
      <Button
        asChild
        variant="ghost"
        className="-ml-3 mb-6"
      >
        <Link href="/dashboard">
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />

          Back to models
        </Link>
      </Button>

      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          New financial model
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create your VentureScope model
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Start with the company and forecasting structure.
          Right after creating the model you will add general,
          revenue and expense assumptions to activate forecasts
          and scenarios.
        </p>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            Want to look around first? Open a ready-made example with assumptions, scenarios and
            financing.
          </p>

          <SampleModelForm size="default" className="shrink-0" />
        </div>
      </div>

      <CreateProjectWizard
        defaultStartMonth={
          defaultStartMonth
        }
      />

      <section className="mt-8 rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="text-base font-semibold">Restore from a backup</h2>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Choose a file you downloaded from the Settings page of a model. It is restored as a new
          model, and nothing you already have is changed.
        </p>

        <ImportModelForm className="mt-4 max-w-md" />
      </section>
    </div>
  );
}
