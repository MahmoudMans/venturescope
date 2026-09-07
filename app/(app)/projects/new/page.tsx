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
        <div className="text-sm font-medium text-muted-foreground">
          New financial model
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create your VentureScope model
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Start with the company and forecasting structure.
          Financial assumptions will be configured in the
          next development phase.
        </p>
      </div>

      <CreateProjectWizard
        defaultStartMonth={
          defaultStartMonth
        }
      />
    </div>
  );
}
