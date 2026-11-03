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

          <CardTitle className="mt-2 break-words text-2xl tracking-tight tabular-nums">
            {value}
          </CardTitle>
        </div>

        <div className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary @min-[11rem]/card-header:flex">
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
