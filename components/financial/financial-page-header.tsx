import type {
  ReactNode,
} from "react";

import {
  Badge,
} from "@/components/ui/badge";

type FinancialPageHeaderProps = {
  eyebrow?: string;

  title: string;

  description: string;

  scenarioName?: string;

  scenarioControl?: ReactNode;
};

export function FinancialPageHeader({
  eyebrow = "Analysis",
  title,
  description,
  scenarioName = "Base Case",
  scenarioControl,
}: FinancialPageHeaderProps) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="text-sm font-medium text-muted-foreground">
          {
            eyebrow
          }
        </div>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          {
            title
          }
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {
            description
          }
        </p>
      </div>

      <div className="flex w-fit items-center gap-2">
        {scenarioControl ?? (
          <Badge>
            {
              scenarioName
            }
          </Badge>
        )}
      </div>
    </section>
  );
}
