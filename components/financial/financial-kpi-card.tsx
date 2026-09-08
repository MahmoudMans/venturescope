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

type FinancialKpiCardProps = {
  label: string;

  value: string;

  detail?: string;

  icon: LucideIcon;
};

export function FinancialKpiCard({
  label,
  value,
  detail,
  icon: Icon,
}: FinancialKpiCardProps) {
  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <CardDescription>
            {label}
          </CardDescription>

          <CardTitle className="mt-2 truncate text-2xl tracking-tight">
            {value}
          </CardTitle>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon
            className="size-4"
            aria-hidden="true"
          />
        </div>
      </CardHeader>

      {detail ? (
        <CardContent>
          <p className="text-xs leading-5 text-muted-foreground">
            {detail}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}
