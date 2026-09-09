import type {
  ProjectAuditMetadata,
} from "@/lib/audit/types";


function isRecord(
  value:
    unknown,
): value is
  Record<
    string,
    unknown
  > {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


export function parseProjectAuditMetadata(
  value:
    unknown,
): ProjectAuditMetadata |
  null {
  if (
    value ===
    null ||
    value ===
    undefined
  ) {
    return null;
  }


  if (
    !isRecord(
      value,
    )
  ) {
    return null;
  }


  const entries =
    Object.entries(
      value,
    ).flatMap(
      (
        [
          key,
          child,
        ],
      ) => {
        if (
          child ===
            null ||
          typeof child ===
            "string" ||
          typeof child ===
            "number" ||
          typeof child ===
            "boolean"
        ) {
          return [
            [
              key,
              child,
            ] as const,
          ];
        }


        return [];
      },
    );


  return Object.fromEntries(
    entries,
  );
}


export function summarizeProjectAuditMetadata(
  metadata:
    ProjectAuditMetadata |
    null,
): string {
  if (
    !metadata
  ) {
    return "—";
  }


  const entries =
    Object.entries(
      metadata,
    );


  if (
    entries.length ===
    0
  ) {
    return "—";
  }


  return entries
    .slice(
      0,
      8,
    )
    .map(
      (
        [
          key,
          value,
        ],
      ) =>
        `${key}=${String(
          value,
        )}`,
    )
    .join(
      " · ",
    );
}
