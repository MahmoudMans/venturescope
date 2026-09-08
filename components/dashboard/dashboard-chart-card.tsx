"use client";

import type {
  LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardChartCardProps = {
  title: string;

  description: string;

  icon: LucideIcon;

  children:
    React.ReactNode;
};

export function DashboardChartCard({
  title,
  description,
  icon: Icon,
  children,
}: DashboardChartCardProps) {
  return (
    <Card className="overflow-hidden border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-5 space-y-0">
        <div>
          <CardTitle className="text-base">
            {
              title
            }
          </CardTitle>

          <CardDescription className="mt-1 leading-5">
            {
              description
            }
          </CardDescription>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon
            className="size-4"
            aria-hidden="true"
          />
        </div>
      </CardHeader>

      <CardContent>
        {
          children
        }
      </CardContent>
    </Card>
  );
}
