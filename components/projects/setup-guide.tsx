import { ArrowRight, Check, CircleCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { modelOverviewHref } from "@/lib/app/navigation";
import {
  nextStepAfter,
  type SetupProgress,
  type SetupStep,
  type SetupStepKey,
  type SetupStepState,
} from "@/lib/projects/setup-steps";
import { cn } from "@/lib/utils";

const STATE_BADGES: Record<
  SetupStepState,
  { label: string; variant: "success" | "info" | "outline" }
> = {
  done: { label: "Done", variant: "success" },
  next: { label: "Next", variant: "info" },
  todo: { label: "To do", variant: "outline" },
};

/**
 * Shows the three setup sections as a short checklist with a progress bar.
 * Each row links to the page where the section is filled in.
 */
export function SetupGuide({
  progress,
  className,
}: {
  progress: SetupProgress;
  className?: string;
}) {
  const summary = `${progress.done} of ${progress.total} sections done`;

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{summary}</span>

          <span className="text-muted-foreground">{progress.percent}%</span>
        </div>

        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-valuetext={summary}
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <ol className="space-y-3">
        {progress.steps.map((step, index) => (
          <SetupGuideRow key={step.key} step={step} position={index + 1} />
        ))}
      </ol>
    </div>
  );
}

function SetupGuideRow({ step, position }: { step: SetupStep; position: number }) {
  const badge = STATE_BADGES[step.state];

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center",
        step.state === "next" && "border-primary/40 bg-muted/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
            step.state === "done" && "border-success/40 bg-success/10 text-success",
            step.state === "next" && "border-primary bg-primary text-primary-foreground",
            step.state === "todo" && "text-muted-foreground",
          )}
        >
          {step.state === "done" ? <Check className="size-4" /> : position}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{step.title}</span>

            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
        </div>
      </div>

      <Button
        asChild
        size="sm"
        variant={step.state === "next" ? "default" : "outline"}
        className="self-start sm:self-center"
      >
        <Link href={step.href}>
          {step.actionLabel}
          <span className="sr-only">: {step.title}</span>
          {step.state === "done" ? null : <ArrowRight className="size-4" aria-hidden="true" />}
        </Link>
      </Button>
    </li>
  );
}

/**
 * A small card for the bottom of an assumptions page. It tells the person what
 * to do next, or that the forecast is ready.
 */
export function SetupNextStep({
  projectId,
  progress,
  current,
}: {
  projectId: string;
  progress: SetupProgress;
  current: SetupStepKey;
}) {
  if (progress.complete) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />

            <div>
              <div className="font-medium">All three sections are set</div>

              <p className="mt-1 text-sm text-muted-foreground">
                Your forecast is ready. Open the overview to see the numbers.
              </p>
            </div>
          </div>

          <Button asChild>
            <Link href={modelOverviewHref(projectId)}>
              Open overview
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const next = nextStepAfter(progress, current);
  const currentDone = progress.steps.some((step) => step.key === current && step.state === "done");
  const counter = `${progress.done} of ${progress.total} sections done`;

  if (next === null) {
    return (
      <Card className="border-dashed">
        <CardContent>
          <div className="font-medium">Save this section to finish setup</div>

          <p className="mt-1 text-sm text-muted-foreground">
            This is the last section left. The forecast is calculated as soon as you save it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{counter}</div>

          <div className="mt-1 font-medium">Next: {next.title}</div>

          <p className="mt-1 text-sm text-muted-foreground">
            {next.description}
            {currentDone ? "" : " Save this section first."}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href={next.href}>
            {next.actionLabel}
            <span className="sr-only">: {next.title}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
