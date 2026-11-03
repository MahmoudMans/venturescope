import {
  ArrowRight,
  CalendarRange,
  Coins,
  Layers3,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  ProjectActions,
} from "@/components/projects/project-actions";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  describeDeleteWarning,
  describeSharedTag,
  type DashboardSharing,
} from "@/lib/dashboard/model-sharing-status";
import type {
  DashboardModelSnapshot,
  DashboardModelStatus,
  DashboardTone,
} from "@/lib/dashboard/summary";
import {
  formatProjectStartMonth,
  formatProjectUpdatedAt,
} from "@/lib/projects/project-dates";
import {
  formatRevenueMode,
} from "@/lib/projects/project-formatting";
import {
  cn,
} from "@/lib/utils";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    industry: string | null;
    currency: string;
    startMonth: Date;
    horizonMonths: number;
    revenueMode: string;
    updatedAt: Date;

    _count: {
      scenarios: number;
    };
  };

  /** Optional live forecast figures for the Base scenario. */
  snapshot?: DashboardModelSnapshot | null;

  /** Where the owner shared the model, or nothing when it is private. */
  sharing?: DashboardSharing | null;

  status?: DashboardModelStatus;

  completedSections?: number;
};

const toneClassName: Record<
  DashboardTone,
  string
> = {
  good: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

function SnapshotStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: DashboardTone;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-between">
      <dt className="break-words text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </dt>

      <dd
        className={cn(
          "mt-1 break-words text-sm font-semibold tabular-nums",
          tone &&
            toneClassName[
              tone
            ],
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function ProjectCard({
  project,
  snapshot = null,
  sharing = null,
  status,
  completedSections = 0,
}: ProjectCardProps) {
  const href =
    `/projects/${project.id}/overview`;

  return (
    <Card className="group flex h-full flex-col border-border/70 transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <TrendingUp
                className="size-4"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <Link
                href={href}
                className="touch-reach block break-words font-semibold tracking-tight hover:underline"
              >
                {project.name}
              </Link>

              <div className="mt-1 break-words text-xs text-muted-foreground">
                {project.industry ??
                  "Industry not specified"}
              </div>
            </div>
          </div>
        </div>

        <ProjectActions
          projectId={
            project.id
          }
          projectName={
            project.name
          }
          returnTo="/dashboard"
          deleteWarning={describeDeleteWarning(sharing)}
        />
      </CardHeader>

      <CardContent className="flex-1">
        {sharing ? (
          <Link
            href={`/projects/${project.id}/settings#sharing`}
            title="Open the sharing settings of this model"
            className="touch-link mb-4 inline-flex max-w-full items-center gap-1.5 rounded-full border bg-accent/50 px-2.5 py-1 text-xs text-accent-foreground transition-colors hover:bg-accent"
          >
            <Users className="size-3 shrink-0" aria-hidden="true" />

            <span className="min-w-0 break-words">{describeSharedTag(sharing)}</span>
          </Link>
        ) : null}

        {snapshot ? (
          <dl className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-accent/50 p-3 min-[360px]:grid-cols-3">
            <SnapshotStat
              label="Year-1 revenue"
              value={
                snapshot.firstYearRevenueLabel
              }
            />

            <SnapshotStat
              label="Ending cash"
              value={
                snapshot.endingCashLabel
              }
            />

            <SnapshotStat
              label="Runway"
              value={
                snapshot.runwayLabel
              }
              tone={
                snapshot.runwayTone
              }
            />
          </dl>
        ) : status ===
          "SETUP_REQUIRED" ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-dashed bg-muted/30 p-3 text-xs">
            <span className="text-muted-foreground">
              {
                completedSections
              }{" "}
              of 3 assumption
              sections complete
            </span>

            <Link
              href={`/projects/${project.id}/assumptions`}
              className="touch-reach shrink-0 font-medium text-primary hover:underline"
            >
              Finish setup
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <ModelAttribute
            icon={Coins}
            label="Currency"
            value={
              project.currency
            }
          />

          <ModelAttribute
            icon={CalendarRange}
            label="Forecast"
            value={`${project.horizonMonths} months`}
          />

          <ModelAttribute
            icon={TrendingUp}
            label="Revenue"
            value={formatRevenueMode(
              project.revenueMode,
            )}
          />

          <ModelAttribute
            icon={Layers3}
            label="Scenarios"
            value={String(
              project._count
                .scenarios,
            )}
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <span>
            Starts{" "}
            {formatProjectStartMonth(
              project.startMonth,
            )}
          </span>

          <span>
            Updated{" "}
            {formatProjectUpdatedAt(
              project.updatedAt,
            )}
          </span>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-5">
        <Button
          asChild
          variant="outline"
          className="w-full"
        >
          <Link href={href}>
            Open model

            <ArrowRight
              className="size-4"
              aria-hidden="true"
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

type ModelAttributeProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
};

function ModelAttribute({
  icon: Icon,
  label,
  value,
}: ModelAttributeProps) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <Icon
          className="size-3"
          aria-hidden="true"
        />

        {label}
      </div>

      <div className="mt-2 break-words text-sm font-medium">
        {value}
      </div>
    </div>
  );
}
