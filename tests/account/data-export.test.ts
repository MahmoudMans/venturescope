import { describe, expect, it } from "vitest";

import {
  ACTUAL_RESULT_COLUMNS,
  DATA_EXPORT_FORMAT,
  DATA_EXPORT_VERSION,
  KPI_TARGET_COLUMNS,
  VARIANCE_COMMENT_COLUMNS,
  actualResultsCsv,
  buildDataExport,
  dataExportFilename,
  exportedWorkspaceRole,
  uniqueFolderNames,
  wrapText,
  type AccountExportFile,
  type DataExportAccount,
  type DataExportModel,
  type DataExportSource,
} from "@/lib/account/data-export";
import { DATA_EXPORT_LEFT_OUT, leftOutLabels } from "@/lib/account/data-export-info";
import { buildZip } from "@/lib/account/zip";
import { DATA_IMPORT_TEMPLATE } from "@/lib/data-import/catalog";
import { validateDataImportCsv } from "@/lib/data-import/validation";
import { buildModelBackup, parseModelBackup } from "@/lib/projects/model-backup";
import { findBackupCalculationProblem } from "@/lib/projects/model-backup-check";
import { buildSampleModel } from "@/lib/projects/sample-model";
import { DEFAULT_PROJECT_SCENARIOS } from "@/lib/projects/scenario-defaults";

const EXPORTED_AT = new Date("2026-10-16T12:00:00Z");

/** Keeps a byte order mark instead of dropping it, so the tests can see it. */
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });

function sampleBase(name: string): DataExportModel {
  const sample = buildSampleModel("2026-10");

  const scenarios = DEFAULT_PROJECT_SCENARIOS.map((scenario, index) => ({
    id: `s${index}`,
    name: scenario.name,
    type: scenario.type,
    modifiers: scenario.modifiers,
  }));

  return {
    name,
    industry: sample.industry,
    currency: sample.currency,
    startMonth: new Date(Date.UTC(2026, 9, 1)),
    horizonMonths: sample.horizonMonths,
    revenueMode: sample.revenueMode,
    baseAssumptions: JSON.parse(JSON.stringify(sample.assumptions)),
    scenarios,
    financingEvents: sample.financingEvents.map((event) => ({
      name: event.name,
      type: event.type,
      month: new Date(`${event.month}-01T00:00:00Z`),
      amount: event.amount,
      apr: event.apr,
      termMonths: event.termMonths,
      repaymentStartMonth: event.repaymentStartMonth
        ? new Date(`${event.repaymentStartMonth}-01T00:00:00Z`)
        : null,
    })),
    monthlyOverrides: sample.overrides.map((override) => ({
      scenarioId:
        override.scenario === "ALL"
          ? null
          : (scenarios.find((scenario) => scenario.type === override.scenario)?.id ?? null),
      month: new Date(`${override.month}-01T00:00:00Z`),
      values: override.values,
      note: override.note,
    })),
    createdAt: new Date("2026-03-01T08:00:00Z"),
    updatedAt: new Date("2026-09-30T17:45:00Z"),
    workspaceName: null,
    actualPeriods: [],
    kpiTargets: [],
    varianceCommentaries: [],
  };
}

const ACCOUNT: DataExportAccount = {
  name: "Amira Ben Salah",
  email: "amira@example.com",
  createdAt: new Date("2026-01-02T09:30:00Z"),
  passwordChangedAt: null,
};

/** A model with real results, a KPI target and a variance comment. */
function richModel(): DataExportModel {
  return {
    ...sampleBase("Orbit Plan"),
    workspaceName: "Leadership",
    actualPeriods: [
      {
        period: new Date(Date.UTC(2026, 10, 1)),
        revenue: "110000.5",
        cogs: null,
        operatingExpenses: null,
        ebitda: null,
        netIncome: null,
        cashFlow: "-4000",
        cashBalance: null,
        mrr: null,
        customers: null,
      },
      {
        period: new Date(Date.UTC(2026, 9, 1)),
        revenue: "100000",
        cogs: "30000",
        operatingExpenses: "50000",
        ebitda: "20000",
        netIncome: "15000",
        cashFlow: "10000",
        cashBalance: "250000",
        mrr: "25000",
        customers: 125,
      },
    ],
    kpiTargets: [
      {
        periodKey: "2026-10",
        metricCode: "REVENUE",
        targetValue: "120000",
        ownerName: "Commercial Lead",
        note: 'Board said: "grow, then hold"',
      },
      {
        periodKey: "2026-10",
        metricCode: "EBITDA_MARGIN",
        targetValue: "20",
        ownerName: null,
        note: null,
      },
    ],
    varianceCommentaries: [
      {
        periodKey: "2026-10",
        metricCode: "REVENUE",
        causeCode: "VOLUME",
        varianceNature: "RECURRING",
        explanation: "Pipeline conversion below plan, again",
        correctiveAction: "Increase qualified pipeline",
        ownerName: "Commercial Lead",
        recoveryPeriodKey: "2026-12",
        status: "MONITORING",
      },
    ],
  };
}

function source(
  models: DataExportModel[] = [richModel(), sampleBase("Second Plan")],
): DataExportSource {
  return {
    account: ACCOUNT,
    workspaces: [
      { name: "Leadership", role: "OWNER", createdAt: new Date("2026-02-01T10:00:00Z") },
      { name: "Partner Fund", role: "VIEWER", createdAt: new Date("2026-04-12T10:00:00Z") },
    ],
    models,
  };
}

function textOf(entries: { path: string; data: Uint8Array }[], path: string): string {
  const found = entries.find((entry) => entry.path === path);

  if (found === undefined) {
    throw new Error(`No file at ${path}`);
  }

  return decoder.decode(found.data);
}

const ROOT = "venturescope-data";

describe("buildDataExport layout", () => {
  const { entries, summary } = buildDataExport(source(), EXPORTED_AT);

  it("puts the README and the account file first, then one folder for each model", () => {
    expect(entries.map((entry) => entry.path)).toEqual([
      `${ROOT}/README.txt`,
      `${ROOT}/account.json`,
      `${ROOT}/models/orbit-plan/model-backup.json`,
      `${ROOT}/models/orbit-plan/actual-results.csv`,
      `${ROOT}/models/orbit-plan/kpi-targets.csv`,
      `${ROOT}/models/orbit-plan/variance-comments.csv`,
      `${ROOT}/models/second-plan/model-backup.json`,
    ]);
  });

  it("counts what it built", () => {
    expect(summary).toEqual({ models: 2, workspaces: 2, files: 7 });
  });

  it("keeps every file inside one folder, so unzipping makes no mess", () => {
    for (const entry of entries) {
      expect(entry.path.startsWith(`${ROOT}/`)).toBe(true);
    }
  });

  it("only writes a CSV file when there are rows for it", () => {
    const paths = entries.map((entry) => entry.path);

    expect(paths.some((path) => path.includes("second-plan/actual-results"))).toBe(false);

    expect(paths.some((path) => path.includes("second-plan/kpi-targets"))).toBe(false);

    expect(paths.some((path) => path.includes("second-plan/variance-comments"))).toBe(false);
  });

  it("builds the same bytes every time", () => {
    const again = buildDataExport(source(), EXPORTED_AT);

    expect(again.entries.map((entry) => entry.path)).toEqual(entries.map((entry) => entry.path));

    for (let index = 0; index < entries.length; index += 1) {
      expect(Array.from(again.entries[index].data)).toEqual(Array.from(entries[index].data));
    }
  });

  it("fits into one ZIP archive", () => {
    const zip = buildZip(entries, EXPORTED_AT);

    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

    expect(view.getUint16(zip.length - 22 + 10, true)).toBe(entries.length);
  });
});

describe("account.json", () => {
  const { entries } = buildDataExport(source(), EXPORTED_AT);

  const account = JSON.parse(textOf(entries, `${ROOT}/account.json`)) as AccountExportFile;

  it("labels the file and says when it was made", () => {
    expect(account.format).toBe(DATA_EXPORT_FORMAT);

    expect(account.version).toBe(DATA_EXPORT_VERSION);

    expect(account.exportedAt).toBe("2026-10-16T12:00:00.000Z");
  });

  it("holds the profile of the person", () => {
    expect(account.account).toEqual({
      name: "Amira Ben Salah",
      email: "amira@example.com",
      memberSince: "2026-01-02T09:30:00.000Z",
      passwordChanged: null,
    });
  });

  it("lists the workspaces with the role of the person", () => {
    expect(account.workspaces).toEqual([
      { name: "Leadership", yourRole: "OWNER", createdAt: "2026-02-01T10:00:00.000Z" },
      { name: "Partner Fund", yourRole: "VIEWER", createdAt: "2026-04-12T10:00:00.000Z" },
    ]);
  });

  it("lists every model with its folder, its files and its counts", () => {
    expect(account.models).toHaveLength(2);

    const first = account.models[0];

    expect(first.name).toBe("Orbit Plan");

    expect(first.folder).toBe("models/orbit-plan");

    expect(first.workspace).toBe("Leadership");

    expect(first.currency).toBe(richModel().currency);

    expect(first.createdAt).toBe("2026-03-01T08:00:00.000Z");

    expect(first.updatedAt).toBe("2026-09-30T17:45:00.000Z");

    expect(first.files).toEqual([
      "model-backup.json",
      "actual-results.csv",
      "kpi-targets.csv",
      "variance-comments.csv",
    ]);

    expect(first.counts.scenarios).toBe(3);

    expect(first.counts.actualResults).toBe(2);

    expect(first.counts.kpiTargets).toBe(2);

    expect(first.counts.varianceComments).toBe(1);

    expect(first.counts.financingEvents).toBe(richModel().financingEvents.length);

    expect(first.counts.monthOverrides).toBe(richModel().monthlyOverrides.length);

    const second = account.models[1];

    expect(second.folder).toBe("models/second-plan");

    expect(second.workspace).toBe(null);

    expect(second.files).toEqual(["model-backup.json"]);
  });

  it("says which records are not included", () => {
    expect(account.notIncluded).toEqual(leftOutLabels());

    expect(account.notIncluded).toContain("the activity history");
  });

  it("never carries sign-in secrets, even when the source object has them", () => {
    const risky = {
      ...ACCOUNT,
      passwordHash: "SECRET-HASH-VALUE",
      authVersion: 7,
      id: "user-internal-id",
    } as DataExportAccount;

    const result = buildDataExport({ ...source(), account: risky }, EXPORTED_AT);

    for (const entry of result.entries) {
      const text = decoder.decode(entry.data);

      expect(text).not.toContain("SECRET-HASH-VALUE");

      expect(text).not.toContain("passwordHash");

      expect(text).not.toContain("authVersion");

      expect(text).not.toContain("user-internal-id");
    }
  });

  it("writes the date of the last password change when there is one", () => {
    const changed = {
      ...ACCOUNT,
      passwordChangedAt: new Date("2026-08-01T00:00:00Z"),
    };

    const result = buildDataExport({ ...source(), account: changed }, EXPORTED_AT);

    const parsed = JSON.parse(textOf(result.entries, `${ROOT}/account.json`)) as AccountExportFile;

    expect(parsed.account.passwordChanged).toBe("2026-08-01T00:00:00.000Z");
  });
});

describe("model backup files", () => {
  const { entries } = buildDataExport(source(), EXPORTED_AT);

  it("can be restored by the restore feature of the app", () => {
    const text = textOf(entries, `${ROOT}/models/orbit-plan/model-backup.json`);

    const parsed = parseModelBackup(text);

    expect(parsed.ok).toBe(true);

    if (parsed.ok) {
      expect(parsed.model).toEqual(buildModelBackup(richModel(), EXPORTED_AT).model);

      expect(findBackupCalculationProblem(parsed.model)).toBeNull();
    }
  });

  it("are the same files that the Settings page of a model gives", () => {
    const text = textOf(entries, `${ROOT}/models/orbit-plan/model-backup.json`);

    expect(text).toBe(`${JSON.stringify(buildModelBackup(richModel(), EXPORTED_AT), null, 2)}\n`);
  });
});

describe("CSV files", () => {
  const { entries } = buildDataExport(source(), EXPORTED_AT);

  const actuals = textOf(entries, `${ROOT}/models/orbit-plan/actual-results.csv`);

  const targets = textOf(entries, `${ROOT}/models/orbit-plan/kpi-targets.csv`);

  const comments = textOf(entries, `${ROOT}/models/orbit-plan/variance-comments.csv`);

  it("start with the same columns as the import templates", () => {
    const header = (type: keyof typeof DATA_IMPORT_TEMPLATE) =>
      DATA_IMPORT_TEMPLATE[type].split("\n")[0].split(",");

    expect(ACTUAL_RESULT_COLUMNS.map((column) => column.header)).toEqual(header("ACTUALS"));

    expect(KPI_TARGET_COLUMNS.map((column) => column.header)).toEqual(header("KPI_TARGETS"));

    expect(VARIANCE_COMMENT_COLUMNS.map((column) => column.header)).toEqual(
      header("VARIANCE_COMMENTARY"),
    );
  });

  it("begin with the mark that Excel needs", () => {
    for (const text of [actuals, targets, comments]) {
      expect(text.charCodeAt(0)).toBe(0xfeff);
    }
  });

  it("put the actual results in month order and keep blanks blank", () => {
    expect(actuals.slice(1)).toBe(
      [
        "period,revenue,cogs,operatingExpenses,ebitda,netIncome,cashFlow,cashBalance,mrr,customers",
        "2026-10,100000,30000,50000,20000,15000,10000,250000,25000,125",
        "2026-11,110000.5,,,,,-4000,,,",
        "",
      ].join("\n"),
    );
  });

  it("pass the checks of the Data Import Center without any problem", () => {
    const actualResult = validateDataImportCsv({ importType: "ACTUALS", csv: actuals });

    expect(actualResult.issues).toEqual([]);

    expect(actualResult.rowCount).toBe(2);

    const targetResult = validateDataImportCsv({ importType: "KPI_TARGETS", csv: targets });

    expect(targetResult.issues).toEqual([]);

    expect(targetResult.rowCount).toBe(2);

    const commentResult = validateDataImportCsv({
      importType: "VARIANCE_COMMENTARY",
      csv: comments,
    });

    expect(commentResult.issues).toEqual([]);

    expect(commentResult.rowCount).toBe(1);
  });

  it("give the same values back when imported", () => {
    const firstActual = validateDataImportCsv({ importType: "ACTUALS", csv: actuals }).rows[0];

    expect(firstActual.kind).toBe("ACTUALS");

    if (firstActual.kind === "ACTUALS") {
      expect(firstActual.periodKey).toBe("2026-10");

      expect(firstActual.revenue).toBe(100000);

      expect(firstActual.customers).toBe(125);
    }

    const rows = validateDataImportCsv({ importType: "KPI_TARGETS", csv: targets }).rows;

    const first = rows[0];

    if (first.kind === "KPI_TARGETS") {
      expect(first.metricCode).toBe("REVENUE");

      expect(first.targetValue).toBe(120000);

      expect(first.ownerName).toBe("Commercial Lead");

      expect(first.note).toBe('Board said: "grow, then hold"');
    }

    const comment = validateDataImportCsv({ importType: "VARIANCE_COMMENTARY", csv: comments })
      .rows[0];

    if (comment.kind === "VARIANCE_COMMENTARY") {
      expect(comment.explanation).toBe("Pipeline conversion below plan, again");

      expect(comment.correctiveAction).toBe("Increase qualified pipeline");

      expect(comment.recoveryPeriodKey).toBe("2026-12");

      expect(comment.status).toBe("MONITORING");
    }
  });

  it("make text that looks like a formula harmless", () => {
    const model = richModel();

    const risky: DataExportModel = {
      ...model,
      kpiTargets: [
        {
          periodKey: "2026-10",
          metricCode: "REVENUE",
          targetValue: "-5",
          ownerName: "=HYPERLINK(1)",
          note: "+1 and @mention",
        },
      ],
      varianceCommentaries: [
        {
          periodKey: "2026-10",
          metricCode: "REVENUE",
          causeCode: "VOLUME",
          varianceNature: "RECURRING",
          explanation: "=1+1",
          correctiveAction: "-fix it",
          ownerName: "@lead",
          recoveryPeriodKey: null,
          status: "OPEN",
        },
      ],
    };

    const built = buildDataExport(source([risky]), EXPORTED_AT);

    const text = textOf(built.entries, `${ROOT}/models/orbit-plan/kpi-targets.csv`);

    expect(text.slice(1)).toBe(
      [
        "periodKey,metricCode,targetValue,ownerName,note",
        "2026-10,REVENUE,-5,'=HYPERLINK(1),'+1 and @mention",
        "",
      ].join("\n"),
    );

    const comments = textOf(built.entries, `${ROOT}/models/orbit-plan/variance-comments.csv`);

    expect(comments.slice(1)).toBe(
      [
        "periodKey,metricCode,causeCode,varianceNature,explanation,correctiveAction,ownerName,recoveryPeriodKey,status",
        "2026-10,REVENUE,VOLUME,RECURRING,'=1+1,'-fix it,'@lead,,OPEN",
        "",
      ].join("\n"),
    );
  });

  it("have only the header line when there are no rows", () => {
    expect(actualResultsCsv([]).slice(1)).toBe(
      `${ACTUAL_RESULT_COLUMNS.map((column) => column.header).join(",")}\n`,
    );
  });
});

describe("README", () => {
  const { entries } = buildDataExport(source(), EXPORTED_AT);

  const readme = textOf(entries, `${ROOT}/README.txt`);

  it("says who and when", () => {
    expect(readme).toContain("Created: 2026-10-16T12:00:00.000Z");

    expect(readme).toContain("Account: Amira Ben Salah (amira@example.com)");
  });

  it("lists the models and their folders", () => {
    expect(readme).toContain("Your models (2)\n---------------\n");

    expect(readme).toContain("\n  models/orbit-plan/   Orbit Plan\n");

    expect(readme).toContain("\n  models/second-plan/   Second Plan\n");

    expect(readme).not.toContain("models/models");
  });

  it("names every kind of record that is left out", () => {
    const flat = readme.replace(/\s+/g, " ");

    for (const label of leftOutLabels()) {
      expect(flat).toContain(label);
    }
  });

  it("explains how to restore a model and how to import the CSV files", () => {
    expect(readme).toContain('"Restore from a backup"');

    expect(readme).toContain("model-backup.json");

    expect(readme).toContain("Data Import Center");
  });

  it("explains the quote in front of some text, and that secrets are never included", () => {
    expect(readme).toContain("has a ' in front of it");

    expect(readme).toContain("Your password, your recovery key and your sign-in sessions");
  });

  it("keeps the list of left-out records in short lines", () => {
    const start = readme.indexOf("Records of your models that are not included");

    const end = readme.indexOf("Models that other people own");

    expect(start).toBeGreaterThan(-1);

    expect(end).toBeGreaterThan(start);

    const lines = readme.slice(start, end).trim().split("\n");

    expect(lines.length).toBeGreaterThan(2);

    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(72);
    }

    expect(lines.join(" ")).toContain(leftOutLabels()[0]);
  });

  it("says that models of other people are not included", () => {
    expect(readme).toContain("Models that other people own are not included");
  });

  it("stays friendly when the person has no models", () => {
    const empty = buildDataExport({ ...source([]), workspaces: [] }, EXPORTED_AT);

    expect(empty.entries.map((entry) => entry.path)).toEqual([
      `${ROOT}/README.txt`,
      `${ROOT}/account.json`,
    ]);

    expect(empty.summary).toEqual({ models: 0, workspaces: 0, files: 2 });

    const text = textOf(empty.entries, `${ROOT}/README.txt`);

    expect(text).toContain("Your models (0)");

    expect(text).toContain("You do not own any models yet.");

    const parsed = JSON.parse(textOf(empty.entries, `${ROOT}/account.json`)) as AccountExportFile;

    expect(parsed.models).toEqual([]);

    expect(parsed.workspaces).toEqual([]);
  });
});

describe("uniqueFolderNames", () => {
  it("makes safe names and numbers the copies", () => {
    expect(
      uniqueFolderNames(["Plan", "plan", "PLAN?", "Plan 2", "", "??", "Report", "Q3 report"]),
    ).toEqual(["plan", "plan-2", "plan-3", "plan-2-2", "model", "model-2", "report", "q3-report"]);
  });

  it("removes accents and symbols", () => {
    expect(uniqueFolderNames(["Caf\u00e9 \u00dcnicode / 2027"])).toEqual(["cafe-unicode-2027"]);
  });

  it("keeps long names short", () => {
    const [name] = uniqueFolderNames(["a".repeat(300)]);

    expect(name.length).toBe(70);
  });

  it("never gives the same folder to two models", () => {
    const names = Array.from({ length: 30 }, () => "Same name");

    const folders = uniqueFolderNames(names);

    expect(new Set(folders).size).toBe(30);
  });

  it("keeps two models with the same name apart in the download", () => {
    const built = buildDataExport(source([sampleBase("Plan"), sampleBase("Plan")]), EXPORTED_AT);

    expect(built.entries.map((entry) => entry.path).slice(2)).toEqual([
      `${ROOT}/models/plan/model-backup.json`,
      `${ROOT}/models/plan-2/model-backup.json`,
    ]);
  });
});

describe("dataExportFilename", () => {
  it("uses the UTC date", () => {
    expect(dataExportFilename(new Date("2026-10-16T23:59:59Z"))).toBe(
      "venturescope-data-2026-10-16.zip",
    );

    expect(dataExportFilename(new Date("2027-01-01T00:00:00Z"))).toBe(
      "venturescope-data-2027-01-01.zip",
    );
  });
});

describe("the list of records that are left out", () => {
  it("has a label for every entry and no empty text", () => {
    for (const item of DATA_EXPORT_LEFT_OUT) {
      expect(item.table).toMatch(/^[A-Z][A-Za-z]+$/);

      expect(item.label.length).toBeGreaterThan(5);
    }
  });

  it("lists each label once", () => {
    const labels = leftOutLabels();

    expect(new Set(labels).size).toBe(labels.length);

    expect(labels.length).toBeLessThanOrEqual(DATA_EXPORT_LEFT_OUT.length);
  });
});

describe("exportedWorkspaceRole", () => {
  it("gives OWNER to the owner of the workspace", () => {
    expect(exportedWorkspaceRole("user-1", "user-1", undefined)).toBe("OWNER");

    expect(exportedWorkspaceRole("user-1", "user-1", "VIEWER")).toBe("OWNER");
  });

  it("gives everyone else the role of their membership", () => {
    expect(exportedWorkspaceRole("user-1", "user-2", "EDITOR")).toBe("EDITOR");

    expect(exportedWorkspaceRole("user-1", "user-2", "VIEWER")).toBe("VIEWER");
  });

  it("uses the lowest role when no membership is found", () => {
    expect(exportedWorkspaceRole("user-1", "user-2", undefined)).toBe("VIEWER");
  });
});

describe("wrapText", () => {
  it("fills each line up to the width and never cuts a word", () => {
    expect(wrapText("one two three four five", 9)).toEqual(["one two", "three", "four five"]);

    expect(wrapText("one two three four five", 100)).toEqual(["one two three four five"]);
  });

  it("keeps a word that is longer than the width on its own line", () => {
    expect(wrapText("a verylongword b", 5)).toEqual(["a", "verylongword", "b"]);
  });

  it("gives no lines for an empty text", () => {
    expect(wrapText("", 10)).toEqual([]);
  });

  it("keeps every word in order", () => {
    const text = "the quick brown fox jumps over the lazy dog again and again";

    expect(wrapText(text, 12).join(" ")).toBe(text);
  });
});
