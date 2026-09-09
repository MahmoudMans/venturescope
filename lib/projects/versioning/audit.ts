import {
  logStructured,
} from "@/lib/observability/logger";


export function logProjectVersionEvent(
  name:
    | "project.revision.created"
    | "project.revision.restored",
  metadata:
    {
      actorUserId:
        string;

      projectId:
        string;

      version:
        number;

      revisionId:
        string;

      sourceRevisionId?:
        string |
        null;
    },
): void {
  logStructured(
    "info",
    name,
    metadata,
  );
}
