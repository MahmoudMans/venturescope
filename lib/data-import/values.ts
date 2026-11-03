import { COLUMN_TITLES, normalizeTitle, shortList } from "@/lib/data-import/headers";
import type { DataImportType } from "@/lib/data-import/types";
import { KPI_METRIC_CODES, type KpiMetricCode } from "@/lib/finance/scorecard/types";
import {
  VARIANCE_CAUSE_CODES,
  VARIANCE_COMMENTARY_STATUSES,
  VARIANCE_METRIC_CODES,
  VARIANCE_NATURES,
  type VarianceCauseCode,
  type VarianceCommentaryStatus,
  type VarianceMetricCode,
  type VarianceNature,
} from "@/lib/finance/variance-review/types";

/** The kinds of code that a KPI file and a variance file hold. */
export type CodeKind = "KPI_METRIC" | "VARIANCE_METRIC" | "CAUSE" | "NATURE" | "STATUS";

const ACTUALS = COLUMN_TITLES.ACTUALS;

/**
 * The other names that are read for each code, written with {@link normalizeTitle}. The code itself
 * is always read, in any way of writing: REVENUE, Revenue, "ebitda margin" and EBITDA_MARGIN are the
 * same. A metric that is also a column of the Actuals file has the same names as that column, so
 * "Chiffre d'affaires" means revenue everywhere.
 */
const KPI_METRIC_NAMES: Record<KpiMetricCode, readonly string[]> = {
  REVENUE: ACTUALS.revenue,
  EBITDA_MARGIN: ["margeebitda", "margedebitda", "margeebe", "margedebe"],
  CASH_BALANCE: ACTUALS.cashBalance,
  MRR: ACTUALS.mrr,
  CUSTOMERS: ACTUALS.customers,
  RUNWAY_MONTHS: ["runway", "moisderunway", "autonomiedetresorerie", "autonomiefinanciere"],
  FORECAST_ACCURACY: [
    "accuracy",
    "precisiondesprevisions",
    "precisionprevisionnelle",
    "fiabilitedesprevisions",
  ],
};

const VARIANCE_METRIC_NAMES: Record<VarianceMetricCode, readonly string[]> = {
  REVENUE: ACTUALS.revenue,
  COGS: ACTUALS.cogs,
  OPERATING_EXPENSES: ACTUALS.operatingExpenses,
  EBITDA: ACTUALS.ebitda,
  NET_INCOME: ACTUALS.netIncome,
  CASH_FLOW: ACTUALS.cashFlow,
  CASH_BALANCE: ACTUALS.cashBalance,
  MRR: ACTUALS.mrr,
  CUSTOMERS: ACTUALS.customers,
};

const CAUSE_NAMES: Record<VarianceCauseCode, readonly string[]> = {
  VOLUME: ["volumes", "quantite", "quantites"],
  PRICE: ["prices", "prix", "tarif", "tarifs"],
  MIX: ["productmix", "mixproduit", "mixproduits", "mixdeproduits"],
  TIMING: ["calendrier", "decalage", "decalagedecalendrier", "decalagetemporel"],
  CHURN_RETENTION: [
    "churn",
    "retention",
    "attrition",
    "perteclients",
    "pertedeclients",
    "fidelisation",
  ],
  INPUT_COST: ["inputcosts", "coutdesintrants", "coutdesmatieres", "coutdesmatierespremieres"],
  HEADCOUNT: ["effectif", "effectifs", "personnel", "massesalariale"],
  MARKETING: ["publicite", "communication"],
  OTHER_OPEX: [
    "otheroperatingexpenses",
    "autresopex",
    "autreschargesdexploitation",
    "autreschargesexploitation",
  ],
  WORKING_CAPITAL: ["bfr", "besoinenfondsderoulement"],
  ONE_OFF: ["exceptionnel", "exceptionnelle", "ponctuel", "ponctuelle"],
  ACCOUNTING_CLASSIFICATION: ["classificationcomptable", "reclassement", "reclassementcomptable"],
  OTHER: ["autre", "autres"],
};

const NATURE_NAMES: Record<VarianceNature, readonly string[]> = {
  ONE_OFF: ["exceptionnel", "exceptionnelle", "ponctuel", "ponctuelle", "unique"],
  RECURRING: ["recurrent", "recurrente", "recurrents", "recurrentes"],
  STRUCTURAL: ["structurel", "structurelle", "structurels", "structurelles"],
  UNKNOWN: ["inconnu", "inconnue", "nonconnu", "nonconnue"],
};

const STATUS_NAMES: Record<VarianceCommentaryStatus, readonly string[]> = {
  OPEN: ["ouvert", "ouverte"],
  MONITORING: ["monitored", "suivi", "ensuivi", "surveillance", "ensurveillance"],
  RESOLVED: ["resolu", "resolue", "regle", "reglee"],
  ACCEPTED: ["accepte", "acceptee", "acceptes"],
};

/** The codes of each kind, in the order of the app, and the other names that are read for them. */
export const CODE_TABLE: Record<
  CodeKind,
  { codes: readonly string[]; names: Record<string, readonly string[]> }
> = {
  KPI_METRIC: { codes: KPI_METRIC_CODES, names: KPI_METRIC_NAMES },
  VARIANCE_METRIC: { codes: VARIANCE_METRIC_CODES, names: VARIANCE_METRIC_NAMES },
  CAUSE: { codes: VARIANCE_CAUSE_CODES, names: CAUSE_NAMES },
  NATURE: { codes: VARIANCE_NATURES, names: NATURE_NAMES },
  STATUS: { codes: VARIANCE_COMMENTARY_STATUSES, names: STATUS_NAMES },
};

function buildLookup(kind: CodeKind): Map<string, string> {
  const { codes, names } = CODE_TABLE[kind];

  const lookup = new Map<string, string>();

  // The code itself comes first, so no other name can take its place.
  for (const code of codes) {
    lookup.set(normalizeTitle(code), code);
  }

  for (const code of codes) {
    for (const name of names[code]) {
      if (lookup.has(name)) {
        continue;
      }

      lookup.set(name, code);
    }
  }

  return lookup;
}

const LOOKUP: Record<CodeKind, Map<string, string>> = {
  KPI_METRIC: buildLookup("KPI_METRIC"),
  VARIANCE_METRIC: buildLookup("VARIANCE_METRIC"),
  CAUSE: buildLookup("CAUSE"),
  NATURE: buildLookup("NATURE"),
  STATUS: buildLookup("STATUS"),
};

/** Gives the code for a text, or null when the text is empty or is not a name of any code. */
export function readCodeValue(kind: CodeKind, text: string): string | null {
  return LOOKUP[kind].get(normalizeTitle(text)) ?? null;
}

/** The fields of each kind of file that hold a code, and the kind of code that each one holds. */
export const CODE_FIELDS: Record<DataImportType, Record<string, CodeKind>> = {
  ACTUALS: {},
  KPI_TARGETS: { metricCode: "KPI_METRIC" },
  VARIANCE_COMMENTARY: {
    metricCode: "VARIANCE_METRIC",
    causeCode: "CAUSE",
    varianceNature: "NATURE",
    status: "STATUS",
  },
};

/** A text of the file that was read as a code with other text: "Marge EBITDA" is EBITDA_MARGIN. */
export type ReadValue = { field: string; text: string; code: string };

export type RecordValues = {
  record: Record<string, string>;
  read: ReadValue[];
};

/**
 * Reads the code columns of one row. Gives back a copy of the row where every name that is known is
 * replaced by its code, and the list of the texts that were read with other text. A text that is
 * empty or not known stays as it was, so the normal check says it is not valid.
 */
export function readRecordValues(
  importType: DataImportType,
  record: Record<string, string>,
): RecordValues {
  const next = { ...record };

  const read: ReadValue[] = [];

  for (const [field, kind] of Object.entries(CODE_FIELDS[importType])) {
    const raw = record[field];

    if (raw === undefined) {
      continue;
    }

    const text = raw.trim();

    const code = readCodeValue(kind, text);

    if (code === null) {
      continue;
    }

    next[field] = code;

    if (text.toLowerCase() !== code.toLowerCase()) {
      read.push({ field, text, code });
    }
  }

  return { record: next, read };
}

/** The messages that the checks of the app give for a code that is not valid, and their kind. */
const INVALID_MESSAGES = new Map<string, CodeKind>([
  ["Invalid KPI metric.", "KPI_METRIC"],
  ["Invalid variance metric.", "VARIANCE_METRIC"],
  ["Invalid variance root cause.", "CAUSE"],
  ["Invalid variance nature.", "NATURE"],
  ["Invalid variance review status.", "STATUS"],
]);

/**
 * Adds the codes that can be used to the message for a code that is not valid. Any other message is
 * given back as it was.
 */
export function describeInvalidValue(message: string): string {
  const kind = INVALID_MESSAGES.get(message);

  if (kind === undefined) {
    return message;
  }

  return `${message} Use one of: ${CODE_TABLE[kind].codes.join(", ")}.`;
}

/**
 * Tells which texts of the file were read as a code, or null when there is nothing to tell. A text
 * that differs from its code only in capital letters is not in the list.
 */
export function describeValues(values: ReadValue[]): string | null {
  const pairs = Array.from(new Set(values.map((item) => `${item.text} = ${item.code}`)));

  return pairs.length > 0 ? `Values were read like this: ${shortList(pairs)}.` : null;
}
