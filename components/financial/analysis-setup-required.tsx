import {
  ArrowRight,
  CircleAlert,
} from "lucide-react";
import Link from "next/link";

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
import type {
  MissingAssumptionSection,
} from "@/lib/finance/analysis-context";

type AnalysisSetupRequiredProps = {
  projectId: string;

  missingSections: MissingAssumptionSection[];
};

const SECTION_LABELS: Record<
  MissingAssumptionSection,
  string
> = {
  general:
    "General assumptions",

  revenue:
    "Revenue assumptions",

  expenses:
    "Expense assumptions",
};

const SECTION_PATHS: Record<
  MissingAssumptionSection,
  string
> = {
  general:
    "assumptions",

  revenue:
    "revenue",

  expenses:
    "expenses",
};

export function AnalysisSetupRequired({
  projectId,
  missingSections,
}: AnalysisSetupRequiredProps) {
  const firstMissing =
    missingSections[0] ??
    "general";

  return (
    <Card className="overflow-hidden border-dashed">
      <CardHeader>
        <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
          <CircleAlert
            className="size-5"
            aria-hidden="true"
          />
        </div>

        <CardTitle className="mt-4">
          Complete the model assumptions first
        </CardTitle>

        <CardDescription className="max-w-2xl leading-6">
          VentureScope does not generate analysis from incomplete inputs.
          Complete the remaining assumption sections before opening the financial forecast.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {(
            [
              "general",
              "revenue",
              "expenses",
            ] as MissingAssumptionSection[]
          ).map(
            (
              section,
            ) => {
              const missing =
                missingSections.includes(
                  section,
                );

              return (
                <div
                  key={
                    section
                  }
                  className="rounded-xl border p-4"
                >
                  <div className="text-sm font-medium">
                    {
                      SECTION_LABELS[
                        section
                      ]
                    }
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {missing
                      ? "Configuration required"
                      : "Configured"}
                  </div>
                </div>
              );
            },
          )}
        </div>

        <Button asChild>
          <Link
            href={`/projects/${projectId}/${SECTION_PATHS[firstMissing]}`}
          >
            Configure{" "}
            {
              SECTION_LABELS[
                firstMissing
              ]
            }

            <ArrowRight
              className="size-4"
              aria-hidden="true"
            />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
