import { toCsv, type CsvColumn } from "@/lib/account/csv-text";
import {
  ACTUAL_RESULTS_FILE,
  DATA_EXPORT_ROOT,
  KPI_TARGETS_FILE,
  MODEL_BACKUP_FILE,
  VARIANCE_COMMENTS_FILE,
  leftOutLabels,
  leftOutSentence,
} from "@/lib/account/data-export-info";
import type { ZipEntry } from "@/lib/account/zip";
import { buildModelBackup, type ModelBackupSource } from "@/lib/projects/model-backup";
import { dateToMonthInput } from "@/lib/projects/project-dates";
import { safeReportFilenamePart } from "@/lib/reports/filename";

export const DATA_EXPORT_FORMAT = "venturescope-account-export";

export const DATA_EXPORT_VERSION = 1;

type Stringable = {
  toString(): string;
};

export type DataExportAccount = {
  name: string;

  email: string;

  createdAt: Date;

  passwordChangedAt: Date | null;
};

export type DataExportWorkspace = {
  name: string;

  /** OWNER, EDITOR or VIEWER. */
  role: string;

  createdAt: Date;
};

export type DataExportActual = {
  period: Date;

  revenue: Stringable | null;

  cogs: Stringable | null;

  operatingExpenses: Stringable | null;

  ebitda: Stringable | null;

  netIncome: Stringable | null;

  cashFlow: Stringable | null;

  cashBalance: Stringable | null;

  mrr: Stringable | null;

  customers: number | null;
};

export type DataExportKpiTarget = {
  periodKey: string;

  metricCode: string;

  targetValue: Stringable;

  ownerName: string | null;

  note: string | null;
};

export type DataExportVarianceComment = {
  periodKey: string;

  metricCode: string;

  causeCode: string;

  varianceNature: string;

  explanation: string;

  correctiveAction: string | null;

  ownerName: string | null;

  recoveryPeriodKey: string | null;

  status: string;
};

export type DataExportModel = ModelBackupSource & {
  createdAt: Date;

  updatedAt: Date;

  /** The name of the workspace the model is shared in, or null. */
  workspaceName: string | null;

  actualPeriods: ReadonlyArray<DataExportActual>;

  kpiTargets: ReadonlyArray<DataExportKpiTarget>;

  varianceCommentaries: ReadonlyArray<DataExportVarianceComment>;
};

/** Everything the download is made from, as plain data. */
export type DataExportSource = {
  account: DataExportAccount;

  workspaces: ReadonlyArray<DataExportWorkspace>;

  models: ReadonlyArray<DataExportModel>;
};

export type AccountExportModelIndex = {
  name: string;

  /** The folder of the model, relative to the root folder of the download. */
  folder: string;

  workspace: string | null;

  currency: string;

  createdAt: string;

  updatedAt: string;

  files: string[];

  counts: {
    scenarios: number;

    financingEvents: number;

    monthOverrides: number;

    actualResults: number;

    kpiTargets: number;

    varianceComments: number;
  };
};

export type AccountExportFile = {
  format: typeof DATA_EXPORT_FORMAT;

  version: typeof DATA_EXPORT_VERSION;

  exportedAt: string;

  account: {
    name: string;

    email: string;

    memberSince: string;

    passwordChanged: string | null;
  };

  workspaces: Array<{
    name: string;

    yourRole: string;

    createdAt: string;
  }>;

  models: AccountExportModelIndex[];

  notIncluded: string[];
};

export type DataExportSummary = {
  models: number;

  workspaces: number;

  files: number;
};

export type DataExport = {
  entries: ZipEntry[];

  summary: DataExportSummary;
};

export const ACTUAL_RESULT_COLUMNS: readonly CsvColumn[] = [
  { header: "period", kind: "plain" },

  { header: "revenue", kind: "plain" },

  { header: "cogs", kind: "plain" },

  { header: "operatingExpenses", kind: "plain" },

  { header: "ebitda", kind: "plain" },

  { header: "netIncome", kind: "plain" },

  { header: "cashFlow", kind: "plain" },

  { header: "cashBalance", kind: "plain" },

  { header: "mrr", kind: "plain" },

  { header: "customers", kind: "plain" },
];

export const KPI_TARGET_COLUMNS: readonly CsvColumn[] = [
  { header: "periodKey", kind: "plain" },

  { header: "metricCode", kind: "plain" },

  { header: "targetValue", kind: "plain" },

  { header: "ownerName", kind: "text" },

  { header: "note", kind: "text" },
];

export const VARIANCE_COMMENT_COLUMNS: readonly CsvColumn[] = [
  { header: "periodKey", kind: "plain" },

  { header: "metricCode", kind: "plain" },

  { header: "causeCode", kind: "plain" },

  { header: "varianceNature", kind: "plain" },

  { header: "explanation", kind: "text" },

  { header: "correctiveAction", kind: "text" },

  { header: "ownerName", kind: "text" },

  { header: "recoveryPeriodKey", kind: "plain" },

  { header: "status", kind: "plain" },
];

const textEncoder = new TextEncoder();

function decimalText(value: Stringable | null): string {
  return value === null ? "" : value.toString();
}

export function actualResultsCsv(rows: ReadonlyArray<DataExportActual>): string {
  return toCsv(
    ACTUAL_RESULT_COLUMNS,
    [...rows]
      .sort((first, second) => first.period.getTime() - second.period.getTime())
      .map((row) => [
        dateToMonthInput(row.period),
        decimalText(row.revenue),
        decimalText(row.cogs),
        decimalText(row.operatingExpenses),
        decimalText(row.ebitda),
        decimalText(row.netIncome),
        decimalText(row.cashFlow),
        decimalText(row.cashBalance),
        decimalText(row.mrr),
        row.customers,
      ]),
  );
}

export function kpiTargetsCsv(rows: ReadonlyArray<DataExportKpiTarget>): string {
  return toCsv(
    KPI_TARGET_COLUMNS,
    rows.map((row) => [
      row.periodKey,
      row.metricCode,
      row.targetValue.toString(),
      row.ownerName,
      row.note,
    ]),
  );
}

export function varianceCommentsCsv(rows: ReadonlyArray<DataExportVarianceComment>): string {
  return toCsv(
    VARIANCE_COMMENT_COLUMNS,
    rows.map((row) => [
      row.periodKey,
      row.metricCode,
      row.causeCode,
      row.varianceNature,
      row.explanation,
      row.correctiveAction,
      row.ownerName,
      row.recoveryPeriodKey,
      row.status,
    ]),
  );
}

function folderBase(name: string): string {
  const slug = safeReportFilenamePart(name);

  return slug === "report" && /report/i.test(name) === false ? "model" : slug;
}

/** One folder name for each model. Models with the same name get -2, -3 and so on. */
export function uniqueFolderNames(names: readonly string[]): string[] {
  const used = new Set<string>();

  return names.map((name) => {
    const base = folderBase(name);

    let candidate = base;

    let counter = 2;

    while (used.has(candidate)) {
      candidate = `${base}-${counter}`;

      counter += 1;
    }

    used.add(candidate);

    return candidate;
  });
}

/** OWNER for the owner of a workspace, otherwise the role from the membership. */
export function exportedWorkspaceRole(
  ownerId: string,
  userId: string,
  membershipRole: string | undefined,
): string {
  if (ownerId === userId) {
    return "OWNER";
  }

  return membershipRole ?? "VIEWER";
}

/** The name of the ZIP file that the browser offers. */
export function dataExportFilename(date: Date): string {
  return `venturescope-data-${date.toISOString().slice(0, 10)}.zip`;
}

/** Breaks a sentence into lines of at most `width` characters, without cutting a word. */
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];

  let current = "";

  for (const word of text.split(" ")) {
    if (current !== "" && current.length + 1 + word.length > width) {
      lines.push(current);

      current = word;
    } else {
      current = current === "" ? word : `${current} ${word}`;
    }
  }

  if (current !== "") {
    lines.push(current);
  }

  return lines;
}

function readmeText(
  source: DataExportSource,
  exportedAt: Date,
  models: readonly AccountExportModelIndex[],
): string {
  const modelsTitle = `Your models (${models.length})`;

  const lines = [
    "VentureScope data download",
    "==========================",
    "",
    `Created: ${exportedAt.toISOString()}`,
    `Account: ${source.account.name} (${source.account.email})`,
    "",
    "What is in this download",
    "------------------------",
    "account.json   Your profile, your workspaces and a list of your models.",
    "models/        One folder for each model that you own.",
    "",
    "A model folder can hold these files:",
    `  ${MODEL_BACKUP_FILE}`,
    "      The settings, assumptions, scenarios, financing events and month",
    "      overrides of the model. You can restore it as a new model.",
    `  ${ACTUAL_RESULTS_FILE}`,
    "      Your real monthly results. Only there if you entered some.",
    `  ${KPI_TARGETS_FILE}`,
    "      Your KPI targets. Only there if you set some.",
    `  ${VARIANCE_COMMENTS_FILE}`,
    "      Your variance comments. Only there if you wrote some.",
    "",
    modelsTitle,
    "-".repeat(modelsTitle.length),
  ];

  if (models.length === 0) {
    lines.push("You do not own any models yet.");
  }

  for (const model of models) {
    lines.push(`  ${model.folder}/   ${model.name}`);
  }

  lines.push(
    "",
    "What is not in this download",
    "----------------------------",
    ...wrapText(`Records of your models that are not included: ${leftOutSentence()}.`, 72),
    "Models that other people own are not included, even when you can open",
    "them in a shared workspace. The people in your workspaces are not listed,",
    "because their details belong to them.",
    "Your password, your recovery key and your sign-in sessions are never",
    "part of a download.",
    "",
    "How to use these files",
    "----------------------",
    'Restore a model: open Create model, use "Restore from a backup" and choose',
    `${MODEL_BACKUP_FILE}. It comes back as a new model, and nothing you already`,
    "have is changed.",
    "",
    "Import a CSV file again: open a model, go to its Data Import Center and",
    "choose the CSV file.",
    "",
    "The CSV files open in Excel, Numbers and Google Sheets. Text that starts",
    "with = + - or @ has a ' in front of it, so that a spreadsheet cannot run it",
    "as a formula.",
    "",
  );

  return lines.join("\n");
}

/**
 * Builds every file of the download. Nothing here reads the database, so the
 * same input always gives the same files.
 */
export function buildDataExport(source: DataExportSource, exportedAt: Date): DataExport {
  const folders = uniqueFolderNames(source.models.map((model) => model.name));

  const modelEntries: ZipEntry[] = [];

  const index: AccountExportModelIndex[] = [];

  source.models.forEach((model, position) => {
    const folder = `models/${folders[position]}`;

    const files: string[] = [];

    const add = (fileName: string, text: string) => {
      modelEntries.push({
        path: `${DATA_EXPORT_ROOT}/${folder}/${fileName}`,

        data: textEncoder.encode(text),
      });

      files.push(fileName);
    };

    add(MODEL_BACKUP_FILE, `${JSON.stringify(buildModelBackup(model, exportedAt), null, 2)}\n`);

    if (model.actualPeriods.length > 0) {
      add(ACTUAL_RESULTS_FILE, actualResultsCsv(model.actualPeriods));
    }

    if (model.kpiTargets.length > 0) {
      add(KPI_TARGETS_FILE, kpiTargetsCsv(model.kpiTargets));
    }

    if (model.varianceCommentaries.length > 0) {
      add(VARIANCE_COMMENTS_FILE, varianceCommentsCsv(model.varianceCommentaries));
    }

    index.push({
      name: model.name,

      folder,

      workspace: model.workspaceName,

      currency: model.currency,

      createdAt: model.createdAt.toISOString(),

      updatedAt: model.updatedAt.toISOString(),

      files,

      counts: {
        scenarios: model.scenarios.length,

        financingEvents: model.financingEvents.length,

        monthOverrides: model.monthlyOverrides.length,

        actualResults: model.actualPeriods.length,

        kpiTargets: model.kpiTargets.length,

        varianceComments: model.varianceCommentaries.length,
      },
    });
  });

  const account: AccountExportFile = {
    format: DATA_EXPORT_FORMAT,

    version: DATA_EXPORT_VERSION,

    exportedAt: exportedAt.toISOString(),

    account: {
      name: source.account.name,

      email: source.account.email,

      memberSince: source.account.createdAt.toISOString(),

      passwordChanged:
        source.account.passwordChangedAt === null
          ? null
          : source.account.passwordChangedAt.toISOString(),
    },

    workspaces: source.workspaces.map((workspace) => ({
      name: workspace.name,

      yourRole: workspace.role,

      createdAt: workspace.createdAt.toISOString(),
    })),

    models: index,

    notIncluded: leftOutLabels(),
  };

  const entries: ZipEntry[] = [
    {
      path: `${DATA_EXPORT_ROOT}/README.txt`,

      data: textEncoder.encode(readmeText(source, exportedAt, index)),
    },

    {
      path: `${DATA_EXPORT_ROOT}/account.json`,

      data: textEncoder.encode(`${JSON.stringify(account, null, 2)}\n`),
    },

    ...modelEntries,
  ];

  return {
    entries,

    summary: {
      models: source.models.length,

      workspaces: source.workspaces.length,

      files: entries.length,
    },
  };
}
