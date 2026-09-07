import {
  ArrowRight,
  CalendarRange,
  Coins,
  Layers3,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import {
  ProjectActions,
} from "@/components/projects/project-actions";
import {
  Badge,
} from "@/components/ui/badge";
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
  formatProjectStartMonth,
  formatProjectUpdatedAt,
} from "@/lib/projects/project-dates";
import {
  formatRevenueMode,
} from "@/lib/projects/project-formatting";

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
};

export function ProjectCard({
  project,
}: ProjectCardProps) {
  const href =
    `/projects/${project.id}/overview`;

  return (
    <Card className="group flex h-full flex-col border-border/70 transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <TrendingUp
                className="size-4"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <Link
                href={href}
                className="block truncate font-semibold tracking-tight hover:underline"
              >
                {project.name}
              </Link>

              <div className="mt-1 truncate text-xs text-muted-foreground">
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
        />
      </CardHeader>

      <CardContent className="flex-1">
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

      <div className="mt-2 truncate text-sm font-medium">
        {value}
      </div>
    </div>
  );
}
