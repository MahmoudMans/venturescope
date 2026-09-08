import {
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import Link from "next/link";

import {
  Button,
} from "@/components/ui/button";

export function ReportExportActions({
  projectId,
  scenarioId,
}: {
  projectId: string;

  scenarioId?: string;
}) {
  const query =
    scenarioId
      ? `?scenario=${encodeURIComponent(
          scenarioId,
        )}`
      : "";

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        asChild
        variant="outline"
      >
        <Link
          href={`/api/projects/${projectId}/export/csv${query}`}
          prefetch={false}
        >
          <FileSpreadsheet
            className="size-4"
            aria-hidden="true"
          />

          Export CSV
        </Link>
      </Button>

      <Button asChild>
        <Link
          href={`/api/projects/${projectId}/export/pdf${query}`}
          prefetch={false}
        >
          <FileText
            className="size-4"
            aria-hidden="true"
          />

          Export PDF

          <Download
            className="size-4"
            aria-hidden="true"
          />
        </Link>
      </Button>
    </div>
  );
}
