import type { DataImportType } from "@/lib/data-import/types";

/**
 * The title of a column the way a person writes it in Excel: "Operating Expenses", "Net income",
 * "Periode", "Chiffre d'affaires". It is made lower case, and accents, spaces, dashes and other marks
 * are removed. So "Operating Expenses", "operating_expenses" and operatingExpenses are the same title.
 */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export type ColumnTitles = Record<string, readonly string[]>;

/**
 * The titles that are read for each field of each file, written with {@link normalizeTitle}. The
 * title that the template uses is always in its list. When a file has two columns for one field, the
 * title of the template wins, and then the first title of the list. The English names come first,
 * the French names of the finance world after them.
 */
export const COLUMN_TITLES: Record<DataImportType, ColumnTitles> = {
  ACTUALS: {
    period: ["month", "period", "date", "mois", "periode"],
    revenue: [
      "revenue",
      "sales",
      "revenu",
      "revenus",
      "ventes",
      "chiffredaffaires",
      "chiffredaffairesht",
      "ca",
      "caht",
    ],
    cogs: [
      "cogs",
      "costofgoodssold",
      "costofsales",
      "coutdesventes",
      "coutsdesventes",
      "coutdesmarchandisesvendues",
      "coutdachatdesmarchandisesvendues",
      "achatsconsommes",
    ],
    operatingExpenses: [
      "operatingexpenses",
      "opex",
      "expenses",
      "chargesdexploitation",
      "chargesexploitation",
      "chargesoperationnelles",
      "depensesdexploitation",
      "depensesoperationnelles",
    ],
    ebitda: ["ebitda", "ebe", "excedentbrutdexploitation"],
    netIncome: ["netincome", "netprofit", "resultatnet", "beneficenet"],
    cashFlow: [
      "cashflow",
      "netcashflow",
      "fluxdetresorerie",
      "fluxnetdetresorerie",
      "variationdetresorerie",
    ],
    cashBalance: [
      "cashbalance",
      "endingcash",
      "soldedetresorerie",
      "tresorerie",
      "tresoreriefinale",
    ],
    mrr: ["mrr", "monthlyrecurringrevenue", "revenurecurrentmensuel", "revenusrecurrentsmensuels"],
    customers: ["customers", "activecustomers", "clients", "clientsactifs", "nombredeclients"],
  },
  KPI_TARGETS: {
    periodKey: ["periodkey", "period", "month", "date", "mois", "periode"],
    metricCode: ["metriccode", "metric", "kpi", "kpicode", "indicateur", "codeindicateur"],
    targetValue: ["targetvalue", "target", "objectif", "cible", "valeurcible", "valeurobjectif"],
    ownerName: ["ownername", "owner", "responsable", "proprietaire"],
    note: ["note", "notes", "comment", "comments", "commentaire", "remarque"],
  },
  VARIANCE_COMMENTARY: {
    periodKey: ["periodkey", "period", "month", "date", "mois", "periode"],
    metricCode: ["metriccode", "metric", "kpi", "kpicode", "indicateur", "codeindicateur"],
    causeCode: ["causecode", "cause", "codecause"],
    varianceNature: ["variancenature", "nature", "natureecart"],
    explanation: ["explanation", "explication", "comment", "commentary", "commentaire"],
    correctiveAction: ["correctiveaction", "action", "actioncorrective"],
    ownerName: ["ownername", "owner", "responsable", "proprietaire"],
    recoveryPeriodKey: [
      "recoveryperiodkey",
      "recoveryperiod",
      "recoverymonth",
      "moisderecuperation",
      "periodederecuperation",
    ],
    status: ["status", "statut"],
  },
};

export type ColumnTitlesRead = {
  /** The field of each column, in the order of the file. A column that is not used keeps its own title. */
  fields: string[];
  /** The titles that were read as a field with other text: "Mois" is read as "period". Capital letters alone do not count. */
  renamed: { title: string; field: string }[];
  /** The titles of the columns that are not used. */
  ignored: string[];
};

/**
 * Finds the field of every column of a file from its titles. A title is read when it is in the list
 * of a field. When two columns can be the same field, the title of the template wins, then the first
 * title of the list, and the other column is not used. Two columns with the same title are refused,
 * because nothing says which one is meant.
 */
export function readColumnTitles(importType: DataImportType, titles: string[]): ColumnTitlesRead {
  const normalized = titles.map(normalizeTitle);

  const chosen = new Map<number, string>();

  for (const [field, known] of Object.entries(COLUMN_TITLES[importType])) {
    const own = normalizeTitle(field);

    const rank = (index: number) =>
      normalized[index] === own ? -1 : known.indexOf(normalized[index]);

    const found = normalized.flatMap((name, index) => (known.includes(name) ? [index] : []));

    if (found.length === 0) {
      continue;
    }

    const best = Math.min(...found.map(rank));

    const winners = found.filter((index) => rank(index) === best);

    if (winners.length > 1) {
      throw new Error(
        `Two columns are read as "${field}": "${titles[winners[0]]}" and "${titles[winners[1]]}". Keep only one of them.`,
      );
    }

    chosen.set(winners[0], field);
  }

  const renamed: { title: string; field: string }[] = [];

  const ignored: string[] = [];

  const fields = titles.map((title, index) => {
    const field = chosen.get(index);

    if (field === undefined) {
      ignored.push(title);

      return title;
    }

    if (title.toLowerCase() !== field.toLowerCase()) {
      renamed.push({ title, field });
    }

    return field;
  });

  return { fields, renamed, ignored };
}

/**
 * The text for a file that lacks required titles. It keeps the first sentence of the old message, and
 * then tells the other titles that are read, so the person knows what to write.
 */
export function describeMissingTitles(importType: DataImportType, missing: string[]): string {
  const others = missing.map((field) => {
    const own = normalizeTitle(field);

    return `${field} = ${COLUMN_TITLES[importType][field].filter((title) => title !== own).join(", ")}`;
  });

  return `Missing required CSV headers: ${missing.join(", ")}. Other titles that are read: ${others.join("; ")}.`;
}

/**
 * An Actuals file with a month column but no column of numbers cannot import anything. This tells so,
 * with the titles that can be used, instead of letting every row pass with no numbers in it.
 */
export function describeNoNumbers(importType: DataImportType, fields: string[]): string | null {
  if (importType !== "ACTUALS") {
    return null;
  }

  const numberFields = Object.keys(COLUMN_TITLES.ACTUALS).filter((field) => field !== "period");

  if (fields.some((field) => numberFields.includes(field))) {
    return null;
  }

  return `No column with numbers was found. Use at least one of these titles: ${numberFields.join(", ")}.`;
}

const MOST_TITLES_SHOWN = 8;

/** The first eight items in one line, and how many more there are. */
export function shortList(items: string[]): string {
  const shown = items.slice(0, MOST_TITLES_SHOWN).join(", ");

  return items.length > MOST_TITLES_SHOWN
    ? `${shown} and ${items.length - MOST_TITLES_SHOWN} more`
    : shown;
}

/**
 * Tells how the column titles of a file were read, or null when there is nothing to tell. It shows
 * a title that was read as a field with other text, and the columns that are not used, so a column
 * that was left out never goes unseen.
 */
export function describeColumns(
  renamed: { title: string; field: string }[],
  ignored: string[],
): string | null {
  const parts: string[] = [];

  if (renamed.length > 0) {
    const pairs = renamed.map((item) => `${item.title} = ${item.field}`);

    parts.push(`Your column titles were read like this: ${shortList(pairs)}.`);
  }

  if (ignored.length > 0) {
    parts.push(`These columns are not used: ${shortList(ignored)}.`);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}
