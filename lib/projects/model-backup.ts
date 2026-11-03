import { financialAssumptionsV1StorageSchema } from "@/lib/finance/assumptions/schemas";
import { parseStoredFinancialAssumptions } from "@/lib/finance/assumptions/storage";
import type { FinancialAssumptionsV1 } from "@/lib/finance/assumptions/types";
import { addMonths, compareMonths } from "@/lib/finance/dates";
import { parseMonthlyOverrideValues } from "@/lib/finance/override-engine";
import type { FinancingType, MonthlyOverrideValues, RevenueMode } from "@/lib/finance/types";
import { createFinancingEventSchema } from "@/lib/financing/validation";
import { MONTHLY_OVERRIDE_FIELDS, monthlyOverrideValuesFromForm } from "@/lib/overrides/storage";
import { createMonthlyOverrideSchema } from "@/lib/overrides/validation";
import { dateToMonthInput } from "@/lib/projects/project-dates";
import { createProjectSchema } from "@/lib/projects/project-validation";
import { safeReportFilenamePart } from "@/lib/reports/filename";

export const MODEL_BACKUP_FORMAT = "venturescope-model-backup";

export const MODEL_BACKUP_VERSION = 1;

export const MAX_BACKUP_SCENARIOS = 10;

export const MAX_BACKUP_FINANCING_EVENTS = 100;

export const MAX_BACKUP_OVERRIDES = 600;

const MAX_CUSTOM_EXPENSES = 50;

export type BackupScenarioType = "BASE" | "BULL" | "BEAR" | "CUSTOM";

export type BackupScenario = {
  name: string;

  type: BackupScenarioType;

  modifiers: Record<string, number>;
};

export type BackupFinancingEvent = {
  name: string;

  type: FinancingType;

  month: string;

  amount: string;

  apr: string | null;

  termMonths: number | null;

  repaymentStartMonth: string | null;
};

export type BackupOverride = {
  /** The name of the scenario it belongs to, or null for every scenario. */
  scenario: string | null;

  month: string;

  values: MonthlyOverrideValues;

  note: string;
};

export type ModelBackupModel = {
  name: string;

  industry: string | null;

  currency: string;

  startMonth: string;

  horizonMonths: number;

  revenueMode: RevenueMode;

  assumptions: FinancialAssumptionsV1;

  scenarios: BackupScenario[];

  financingEvents: BackupFinancingEvent[];

  overrides: BackupOverride[];
};

export type ModelBackup = {
  format: typeof MODEL_BACKUP_FORMAT;

  version: typeof MODEL_BACKUP_VERSION;

  exportedAt: string;

  model: ModelBackupModel;
};

export type ParsedModelBackup =
  | { ok: true; model: ModelBackupModel }
  | { ok: false; message: string };

type Step<T> = { ok: true; value: T } | { ok: false; message: string };

type JsonRecord = Record<string, unknown>;

type MonthWindow = {
  start: string;

  end: string;
};

const SCENARIO_TYPES: ReadonlyArray<BackupScenarioType> = ["BASE", "BULL", "BEAR", "CUSTOM"];

const FINANCING_TYPES: ReadonlyArray<FinancingType> = ["EQUITY", "DEBT", "GRANT", "OTHER"];

/** The same limits the scenario form enforces, written as multipliers and rates. */
const MODIFIER_LIMITS: Record<string, { min: number; max: number }> = {
  revenueGrowthMultiplier: { min: 0, max: 6 },

  customerAcquisitionGrowthMultiplier: { min: 0, max: 6 },

  arpuMultiplier: { min: 0, max: 6 },

  cacMultiplier: { min: 0.01, max: 6 },

  churnPercentagePointDelta: { min: -1, max: 1 },

  cogsPercentagePointDelta: { min: -1, max: 1 },
};

const NUMBER_PATTERN = /^-?(?:\d+|\d+\.\d+|\.\d+)$/;

/** Text fields inside the assumptions. Everything else there must be a number. */
const ASSUMPTION_TEXT_KEYS = new Set(["id", "name", "growthPeriod", "method"]);

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

function failure(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value === "object" && value !== null && Array.isArray(value) === false) {
    return value as JsonRecord;
  }

  return null;
}

function asList(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && NUMBER_PATTERN.test(value.trim())) {
    const parsed = Number(value.trim());

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/** Text for the form validators: empty for a missing value, null for a wrong type. */
function toFormText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function describeIssue(issue: { message: string; path: ReadonlyArray<PropertyKey> }): string {
  const field = String(issue.path[0] ?? "");

  if (issue.message.startsWith("Invalid input") && field !== "") {
    return `"${field}" is missing or has the wrong type.`;
  }

  return issue.message;
}

/** The first path in the assumptions that is not a plain number, or null. */
function findAssumptionProblem(value: unknown, path: string): string | null {
  if (typeof value === "string") {
    const key = path.slice(path.lastIndexOf(".") + 1);

    if (ASSUMPTION_TEXT_KEYS.has(key)) {
      return value.length <= 100 ? null : path;
    }

    const valid =
      value.length <= 40 && NUMBER_PATTERN.test(value) && Math.abs(Number(value)) <= 1e15;

    return valid ? null : path;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const problem = findAssumptionProblem(value[index], `${path}.${index}`);

      if (problem !== null) {
        return problem;
      }
    }

    return null;
  }

  const record = asRecord(value);

  if (record !== null) {
    for (const [key, item] of Object.entries(record)) {
      const problem = findAssumptionProblem(item, `${path}.${key}`);

      if (problem !== null) {
        return problem;
      }
    }
  }

  return null;
}

function parseSettings(model: JsonRecord): Step<{
  name: string;
  industry: string | null;
  currency: string;
  startMonth: string;
  horizonMonths: number;
  revenueMode: RevenueMode;
}> {
  const parsed = createProjectSchema.safeParse({
    name: model.name,

    industry: model.industry ?? "",

    currency: model.currency,

    startMonth: model.startMonth,

    horizonMonths: model.horizonMonths,

    revenueMode: model.revenueMode,
  });

  if (parsed.success === false) {
    const issue = parsed.error.issues[0];

    return failure(
      `The model settings in this backup are not valid: ${
        issue ? describeIssue(issue) : "unknown problem."
      }`,
    );
  }

  return { ok: true, value: parsed.data };
}

function parseAssumptions(value: unknown): Step<FinancialAssumptionsV1> {
  const parsed = financialAssumptionsV1StorageSchema.safeParse(value);

  if (parsed.success === false) {
    return failure("The assumptions in this backup are incomplete or damaged.");
  }

  if (parsed.data.expenses.operatingExpenses.custom.length > MAX_CUSTOM_EXPENSES) {
    return failure(`A model can contain at most ${MAX_CUSTOM_EXPENSES} custom expenses.`);
  }

  const problem = findAssumptionProblem(parsed.data, "assumptions");

  if (problem !== null) {
    return failure(
      `The assumptions in this backup contain a value that is not valid (${problem}).`,
    );
  }

  return { ok: true, value: parsed.data };
}

function readModifiers(value: unknown, label: string): Step<Record<string, number>> {
  if (value === undefined || value === null) {
    return { ok: true, value: {} };
  }

  const record = asRecord(value);

  if (record === null) {
    return failure(`${label}: the scenario settings are not valid.`);
  }

  const result: Record<string, number> = {};

  for (const [key, limits] of Object.entries(MODIFIER_LIMITS)) {
    const raw = record[key];

    if (raw === undefined) {
      continue;
    }

    const parsed = numberFrom(raw);

    if (parsed === null || parsed < limits.min || parsed > limits.max) {
      return failure(`${label}: "${key}" must be a number from ${limits.min} to ${limits.max}.`);
    }

    result[key] = parsed;
  }

  return { ok: true, value: result };
}

function parseScenarios(value: unknown): Step<BackupScenario[]> {
  const list = asList(value);

  if (list === null || list.length === 0) {
    return failure("This backup has no scenarios.");
  }

  if (list.length > MAX_BACKUP_SCENARIOS) {
    return failure(`A model can contain at most ${MAX_BACKUP_SCENARIOS} scenarios.`);
  }

  const scenarios: BackupScenario[] = [];

  const names = new Set<string>();

  const counts = { BASE: 0, BULL: 0, BEAR: 0 };

  for (let index = 0; index < list.length; index += 1) {
    const label = `Scenario ${index + 1}`;

    const item = asRecord(list[index]);

    if (item === null) {
      return failure(`${label} is not valid.`);
    }

    const name = typeof item.name === "string" ? item.name.trim() : "";

    if (name.length < 2 || name.length > 80) {
      return failure(`${label}: the name must contain 2 to 80 characters.`);
    }

    if (names.has(name.toLowerCase())) {
      return failure(`${label}: the name "${name}" is used twice.`);
    }

    names.add(name.toLowerCase());

    const type = SCENARIO_TYPES.find((candidate) => candidate === item.type);

    if (type === undefined) {
      return failure(`${label}: the scenario type is not valid.`);
    }

    if (type !== "CUSTOM") {
      counts[type] += 1;
    }

    const modifiers = readModifiers(item.modifiers, label);

    if (modifiers.ok === false) {
      return modifiers;
    }

    scenarios.push({ name, type, modifiers: modifiers.value });
  }

  if (counts.BASE !== 1) {
    return failure("A backup needs exactly one Base scenario.");
  }

  if (counts.BULL > 1 || counts.BEAR > 1) {
    return failure("A backup can contain only one Bull and one Bear scenario.");
  }

  return { ok: true, value: scenarios };
}

function parseFinancingEvents(value: unknown, window: MonthWindow): Step<BackupFinancingEvent[]> {
  if (value === undefined || value === null) {
    return { ok: true, value: [] };
  }

  const list = asList(value);

  if (list === null) {
    return failure("The financing events in this backup are not valid.");
  }

  if (list.length > MAX_BACKUP_FINANCING_EVENTS) {
    return failure(`A model can contain at most ${MAX_BACKUP_FINANCING_EVENTS} financing events.`);
  }

  const events: BackupFinancingEvent[] = [];

  for (let index = 0; index < list.length; index += 1) {
    const label = `Financing event ${index + 1}`;

    const item = asRecord(list[index]);

    if (item === null) {
      return failure(`${label} is not valid.`);
    }

    const amount = toFormText(item.amount);

    const apr = toFormText(item.apr);

    const termMonths = toFormText(item.termMonths);

    const repaymentStartMonth = toFormText(item.repaymentStartMonth);

    if (amount === null || apr === null || termMonths === null || repaymentStartMonth === null) {
      return failure(`${label}: a value has the wrong type.`);
    }

    const parsed = createFinancingEventSchema.safeParse({
      projectId: "backup",

      name: item.name,

      type: item.type,

      month: item.month,

      amount,

      apr,

      termMonths,

      repaymentStartMonth,
    });

    if (parsed.success === false) {
      const issue = parsed.error.issues[0];

      return failure(`${label}: ${issue ? describeIssue(issue) : "it is not valid."}`);
    }

    const data = parsed.data;

    if (compareMonths(data.month, window.start) < 0 || compareMonths(data.month, window.end) > 0) {
      return failure(`${label}: the month must be from ${window.start} to ${window.end}.`);
    }

    const debt = data.type === "DEBT";

    let repayment: string | null = null;

    if (debt) {
      const earliest = addMonths(data.month, 1);

      repayment = data.repaymentStartMonth === "" ? earliest : data.repaymentStartMonth;

      if (compareMonths(repayment, earliest) < 0) {
        return failure(`${label}: repayment must start in ${earliest} or later.`);
      }
    }

    events.push({
      name: data.name,

      type: data.type,

      month: data.month,

      amount: data.amount,

      apr: debt ? data.apr : null,

      termMonths: debt ? Number(data.termMonths) : null,

      repaymentStartMonth: repayment,
    });
  }

  return { ok: true, value: events };
}

function parseOverrides(
  value: unknown,
  scenarioNames: ReadonlySet<string>,
  window: MonthWindow,
): Step<BackupOverride[]> {
  if (value === undefined || value === null) {
    return { ok: true, value: [] };
  }

  const list = asList(value);

  if (list === null) {
    return failure("The month overrides in this backup are not valid.");
  }

  if (list.length > MAX_BACKUP_OVERRIDES) {
    return failure(`A model can contain at most ${MAX_BACKUP_OVERRIDES} month overrides.`);
  }

  const overrides: BackupOverride[] = [];

  const seen = new Set<string>();

  for (let index = 0; index < list.length; index += 1) {
    const label = `Month override ${index + 1}`;

    const item = asRecord(list[index]);

    if (item === null) {
      return failure(`${label} is not valid.`);
    }

    let scenario: string | null = null;

    if (item.scenario !== null && item.scenario !== undefined && item.scenario !== "") {
      if (typeof item.scenario !== "string" || scenarioNames.has(item.scenario) === false) {
        return failure(`${label}: it belongs to a scenario that is not in this backup.`);
      }

      scenario = item.scenario;
    }

    const rawValues = asRecord(item.values);

    if (rawValues === null) {
      return failure(`${label}: the override values are missing.`);
    }

    const fields: Record<string, string> = {};

    for (const field of MONTHLY_OVERRIDE_FIELDS) {
      const text = toFormText(rawValues[field]);

      if (text === null) {
        return failure(`${label}: "${field}" has the wrong type.`);
      }

      fields[field] = text;
    }

    const note = toFormText(item.note);

    if (note === null) {
      return failure(`${label}: the note has the wrong type.`);
    }

    const parsed = createMonthlyOverrideSchema.safeParse({
      projectId: "backup",

      scenarioId: "",

      month: item.month,

      ...fields,

      note,
    });

    if (parsed.success === false) {
      const issue = parsed.error.issues[0];

      return failure(`${label}: ${issue ? describeIssue(issue) : "it is not valid."}`);
    }

    const month = parsed.data.month;

    if (compareMonths(month, window.start) < 0 || compareMonths(month, window.end) > 0) {
      return failure(`${label}: the month must be from ${window.start} to ${window.end}.`);
    }

    const key = `${scenario ?? ""}|${month}`;

    if (seen.has(key)) {
      return failure(`${label}: there is already an override for this month and scenario.`);
    }

    seen.add(key);

    overrides.push({
      scenario,

      month,

      values: monthlyOverrideValuesFromForm(parsed.data),

      note: parsed.data.note,
    });
  }

  return { ok: true, value: overrides };
}

/**
 * Reads the text of a backup file. Nothing in the file is trusted: every value
 * goes through the same rules the forms of the app use, and a file that breaks
 * a rule is refused as a whole.
 */
export function parseModelBackup(text: string): ParsedModelBackup {
  let parsedText: unknown;

  try {
    parsedText = JSON.parse(text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text);
  } catch {
    return failure("This file is not valid JSON. Choose the file you downloaded from a model.");
  }

  const json = asRecord(parsedText);

  if (json === null || json.format !== MODEL_BACKUP_FORMAT) {
    return failure("This is not a VentureScope model backup.");
  }

  if (json.version !== MODEL_BACKUP_VERSION) {
    return failure("This backup comes from a different version of VentureScope.");
  }

  const model = asRecord(json.model);

  if (model === null) {
    return failure("This backup does not contain a model.");
  }

  const settings = parseSettings(model);

  if (settings.ok === false) {
    return settings;
  }

  const assumptions = parseAssumptions(model.assumptions);

  if (assumptions.ok === false) {
    return assumptions;
  }

  const scenarios = parseScenarios(model.scenarios);

  if (scenarios.ok === false) {
    return scenarios;
  }

  const window: MonthWindow = {
    start: settings.value.startMonth,

    end: addMonths(settings.value.startMonth, settings.value.horizonMonths - 1),
  };

  const financingEvents = parseFinancingEvents(model.financingEvents, window);

  if (financingEvents.ok === false) {
    return financingEvents;
  }

  const overrides = parseOverrides(
    model.overrides,
    new Set(scenarios.value.map((scenario) => scenario.name)),
    window,
  );

  if (overrides.ok === false) {
    return overrides;
  }

  return {
    ok: true,

    model: {
      ...settings.value,

      assumptions: assumptions.value,

      scenarios: scenarios.value,

      financingEvents: financingEvents.value,

      overrides: overrides.value,
    },
  };
}

type Stringable = {
  toString(): string;
};

/** A model as the database returns it, with its scenarios, financing and overrides. */
export type ModelBackupSource = {
  name: string;

  industry: string | null;

  currency: string;

  startMonth: Date;

  horizonMonths: number;

  revenueMode: string;

  baseAssumptions: unknown;

  scenarios: ReadonlyArray<{
    id: string;
    name: string;
    type: string;
    modifiers: unknown;
  }>;

  financingEvents: ReadonlyArray<{
    name: string;
    type: string;
    month: Date;
    amount: Stringable;
    apr: Stringable | null;
    termMonths: number | null;
    repaymentStartMonth: Date | null;
  }>;

  monthlyOverrides: ReadonlyArray<{
    scenarioId: string | null;
    month: Date;
    values: unknown;
    note: string | null;
  }>;
};

function exportScenarioType(value: string): BackupScenarioType {
  return SCENARIO_TYPES.find((candidate) => candidate === value) ?? "CUSTOM";
}

function exportFinancingType(value: string): FinancingType {
  return FINANCING_TYPES.find((candidate) => candidate === value) ?? "OTHER";
}

function exportModifiers(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};

  const record = asRecord(value);

  if (record === null) {
    return result;
  }

  for (const key of Object.keys(MODIFIER_LIMITS)) {
    const parsed = numberFrom(record[key]);

    if (parsed !== null) {
      result[key] = parsed;
    }
  }

  return result;
}

/** The backup file for a model: everything needed to rebuild it as a new model. */
export function buildModelBackup(source: ModelBackupSource, exportedAt: Date): ModelBackup {
  const scenarioNames = new Map(
    source.scenarios.map((scenario): [string, string] => [scenario.id, scenario.name]),
  );

  const financingEvents = [...source.financingEvents]
    .sort(
      (first, second) =>
        first.month.getTime() - second.month.getTime() || first.name.localeCompare(second.name),
    )
    .map(
      (event): BackupFinancingEvent => ({
        name: event.name,

        type: exportFinancingType(event.type),

        month: dateToMonthInput(event.month),

        amount: event.amount.toString(),

        apr: event.apr === null ? null : event.apr.toString(),

        termMonths: event.termMonths,

        repaymentStartMonth:
          event.repaymentStartMonth === null ? null : dateToMonthInput(event.repaymentStartMonth),
      }),
    );

  const overrides = source.monthlyOverrides
    .map(
      (override): BackupOverride => ({
        scenario:
          override.scenarioId === null ? null : (scenarioNames.get(override.scenarioId) ?? null),

        month: dateToMonthInput(override.month),

        values: parseMonthlyOverrideValues(override.values),

        note: override.note ?? "",
      }),
    )
    .sort(
      (first, second) =>
        first.month.localeCompare(second.month) ||
        (first.scenario ?? "").localeCompare(second.scenario ?? ""),
    );

  return {
    format: MODEL_BACKUP_FORMAT,

    version: MODEL_BACKUP_VERSION,

    exportedAt: exportedAt.toISOString(),

    model: {
      name: source.name,

      industry: source.industry,

      currency: source.currency,

      startMonth: dateToMonthInput(source.startMonth),

      horizonMonths: source.horizonMonths,

      revenueMode: source.revenueMode === "DIRECT" ? "DIRECT" : "CUSTOMER_DRIVEN",

      assumptions: parseStoredFinancialAssumptions(source.baseAssumptions),

      scenarios: source.scenarios.map(
        (scenario): BackupScenario => ({
          name: scenario.name,

          type: exportScenarioType(scenario.type),

          modifiers: exportModifiers(scenario.modifiers),
        }),
      ),

      financingEvents,

      overrides,
    },
  };
}

/** The file name the browser offers for a downloaded backup. */
export function backupFilename(modelName: string): string {
  return `venturescope-${safeReportFilenamePart(modelName)}-backup.json`;
}

/**
 * Restoring never overwrites anything. When the person already has a model
 * with this name, the restored copy gets a suffix so the two can be told apart.
 */
export function restoredModelName(name: string, alreadyUsed: boolean): string {
  if (alreadyUsed === false) {
    return name;
  }

  const suffix = " (restored)";

  return `${name.slice(0, 100 - suffix.length).trimEnd()}${suffix}`;
}
