import { ClipboardList } from "lucide-react";

import { SetupGuide } from "@/components/projects/setup-guide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MissingAssumptionSection } from "@/lib/finance/analysis-context";
import { buildSetupProgress, completionFromMissing } from "@/lib/projects/setup-steps";

type AnalysisSetupRequiredProps = {
  projectId: string;

  missingSections: MissingAssumptionSection[];
};

export function AnalysisSetupRequired({ projectId, missingSections }: AnalysisSetupRequiredProps) {
  const progress = buildSetupProgress(projectId, completionFromMissing(missingSections));

  return (
    <Card className="overflow-hidden border-dashed">
      <CardHeader>
        <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
          <ClipboardList className="size-5" aria-hidden="true" />
        </div>

        <CardTitle className="mt-4">Finish setting up this model</CardTitle>

        <CardDescription className="max-w-2xl leading-6">
          VentureScope needs three sections before it can calculate a forecast. Fill them in one by
          one. Your numbers appear here as soon as the last section is saved.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <SetupGuide progress={progress} />
      </CardContent>
    </Card>
  );
}
