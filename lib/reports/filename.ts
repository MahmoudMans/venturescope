export function safeReportFilenamePart(
  value: string,
): string {
  const normalized =
    value
      .normalize(
        "NFKD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "")
      .slice(
        0,
        70,
      );

  return normalized ||
    "report";
}

export function reportFilename(
  projectName: string,
  scenarioName: string,
  extension:
    | "csv"
    | "pdf",
): string {
  return [
    "venturescope",
    safeReportFilenamePart(
      projectName,
    ),
    safeReportFilenamePart(
      scenarioName,
    ),
    "forecast",
  ].join(
    "-",
  ) + `.${extension}`;
}
