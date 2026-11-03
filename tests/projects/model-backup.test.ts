import { describe, expect, it } from "vitest";

import { generateFinancialForecast } from "@/lib/finance/engine";
import { buildFinancialModelInput } from "@/lib/finance/project-input";
import {
  MAX_BACKUP_FINANCING_EVENTS,
  MAX_BACKUP_OVERRIDES,
  MAX_BACKUP_SCENARIOS,
  MODEL_BACKUP_FORMAT,
  MODEL_BACKUP_VERSION,
  backupFilename,
  buildModelBackup,
  parseModelBackup,
  restoredModelName,
  type ModelBackupModel,
  type ModelBackupSource,
} from "@/lib/projects/model-backup";
import { findBackupCalculationProblem } from "@/lib/projects/model-backup-check";
import { buildSampleModel } from "@/lib/projects/sample-model";
import { DEFAULT_PROJECT_SCENARIOS } from "@/lib/projects/scenario-defaults";

const EXPORTED_AT = new Date("2026-10-16T12:00:00Z");

function sampleSource(): ModelBackupSource {
  const sample = buildSampleModel("2026-10");

  const scenarios = DEFAULT_PROJECT_SCENARIOS.map((scenario, index) => ({
    id: `s${index}`,
    name: scenario.name,
    type: scenario.type,
    modifiers: scenario.modifiers,
  }));

  return {
    name: sample.name,
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
  };
}

/** A restored model written back as database rows, as the app does when it saves it. */
function sourceFromModel(model: ModelBackupModel): ModelBackupSource {
  const scenarios = model.scenarios.map((scenario, index) => ({
    id: `r${index}`,
    name: scenario.name,
    type: scenario.type,
    modifiers: scenario.modifiers,
  }));

  return {
    name: model.name,
    industry: model.industry,
    currency: model.currency,
    startMonth: new Date(`${model.startMonth}-01T00:00:00Z`),
    horizonMonths: model.horizonMonths,
    revenueMode: model.revenueMode,
    baseAssumptions: JSON.parse(JSON.stringify(model.assumptions)),
    scenarios,
    financingEvents: model.financingEvents.map((event) => ({
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
    monthlyOverrides: model.overrides.map((override) => ({
      scenarioId:
        override.scenario === null
          ? null
          : (scenarios.find((scenario) => scenario.name === override.scenario)?.id ?? null),
      month: new Date(`${override.month}-01T00:00:00Z`),
      values: override.values,
      note: override.note,
    })),
  };
}

function sampleModel(): ModelBackupModel {
  return buildModelBackup(sampleSource(), EXPORTED_AT).model;
}

/** The text of a backup file whose model has the given fields replaced. */
function backupWith(patch: Record<string, unknown>): string {
  return JSON.stringify({
    format: MODEL_BACKUP_FORMAT,
    version: MODEL_BACKUP_VERSION,
    exportedAt: EXPORTED_AT.toISOString(),
    model: { ...sampleModel(), ...patch },
  });
}

function messageOf(text: string): string {
  const result = parseModelBackup(text);

  expect(result.ok).toBe(false);

  return result.ok ? "" : result.message;
}

describe("buildModelBackup", () => {
  const backup = buildModelBackup(sampleSource(), EXPORTED_AT);

  it("labels the file so that other files can be told apart", () => {
    expect(backup.format).toBe("venturescope-model-backup");

    expect(backup.version).toBe(1);

    expect(backup.exportedAt).toBe("2026-10-16T12:00:00.000Z");
  });

  it("writes the model settings with the start month as text", () => {
    expect(backup.model.name).toBe("Orbit Analytics (sample)");

    expect(backup.model.startMonth).toBe("2026-10");

    expect(backup.model.horizonMonths).toBe(36);

    expect(backup.model.revenueMode).toBe("CUSTOMER_DRIVEN");
  });

  it("keeps the scenarios in order with their modifiers", () => {
    expect(backup.model.scenarios.map((scenario) => scenario.name)).toEqual([
      "Base Case",
      "Bull Case",
      "Bear Case",
    ]);

    expect(backup.model.scenarios.map((scenario) => scenario.type)).toEqual([
      "BASE",
      "BULL",
      "BEAR",
    ]);

    expect(backup.model.scenarios[1]?.modifiers.arpuMultiplier).toBe(1.05);
  });

  it("writes money as text and the loan terms only for the loan", () => {
    const debt = backup.model.financingEvents.find((event) => event.type === "DEBT");

    expect(debt?.apr).toBe("7.5");

    expect(debt?.termMonths).toBe(36);

    expect(typeof debt?.amount).toBe("string");

    for (const event of backup.model.financingEvents) {
      if (event.type !== "DEBT") {
        expect(event.apr).toBe(null);
      }
    }
  });

  it("names the scenario of an override instead of using a database id", () => {
    const scenarios = new Set(backup.model.overrides.map((override) => override.scenario));

    expect(scenarios.has(null)).toBe(true);

    expect(scenarios.has("Bull Case")).toBe(true);

    expect(scenarios.has("Bear Case")).toBe(true);

    expect(JSON.stringify(backup)).not.toContain('"s1"');
  });

  it("lists financing events and overrides by month", () => {
    const months = backup.model.financingEvents.map((event) => event.month);

    expect([...months].sort()).toEqual(months);

    const overrideMonths = backup.model.overrides.map((override) => override.month);

    expect([...overrideMonths].sort()).toEqual(overrideMonths);
  });

  it("lists everything by month whatever order the database returns it in", () => {
    const source = sampleSource();

    const shuffled: ModelBackupSource = {
      ...source,
      financingEvents: [...source.financingEvents].reverse(),
      monthlyOverrides: [...source.monthlyOverrides].reverse(),
    };

    expect(buildModelBackup(shuffled, EXPORTED_AT)).toEqual(backup);
  });

  it("writes the same file every time for the same model", () => {
    expect(JSON.stringify(buildModelBackup(sampleSource(), EXPORTED_AT))).toBe(
      JSON.stringify(backup),
    );
  });

  it("does not carry database ids, owners or workspaces", () => {
    const text = JSON.stringify(backup);

    expect(text).not.toContain("userId");

    expect(text).not.toContain("workspace");

    expect(text).not.toContain("projectId");
  });
});

describe("parseModelBackup", () => {
  it("restores exactly what was exported", () => {
    const backup = buildModelBackup(sampleSource(), EXPORTED_AT);

    const result = parseModelBackup(JSON.stringify(backup, null, 2));

    expect(result).toEqual({ ok: true, model: backup.model });
  });

  it("accepts a file that starts with a byte order mark", () => {
    const text = String.fromCharCode(0xfeff) + backupWith({});

    expect(parseModelBackup(text).ok).toBe(true);
  });

  it("restores a model that has no industry", () => {
    const result = parseModelBackup(backupWith({ industry: null }));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.model.industry).toBe(null);
    }
  });

  it("restores a model that has no financing and no overrides", () => {
    const result = parseModelBackup(backupWith({ financingEvents: [], overrides: [] }));

    expect(result.ok).toBe(true);

    const bare = parseModelBackup(backupWith({ financingEvents: undefined, overrides: undefined }));

    expect(bare.ok).toBe(true);
  });

  it("refuses text that is not JSON", () => {
    expect(messageOf("hello")).toContain("not valid JSON");

    expect(messageOf("")).toContain("not valid JSON");
  });

  it("refuses JSON that is not a backup", () => {
    expect(messageOf("[]")).toContain("not a VentureScope model backup");

    expect(messageOf("{}")).toContain("not a VentureScope model backup");

    expect(messageOf(JSON.stringify({ format: "other", version: 1, model: {} }))).toContain(
      "not a VentureScope model backup",
    );
  });

  it("refuses a backup from another version", () => {
    const text = JSON.stringify({ format: MODEL_BACKUP_FORMAT, version: 2, model: {} });

    expect(messageOf(text)).toContain("different version");
  });

  it("refuses a backup without a model", () => {
    const text = JSON.stringify({ format: MODEL_BACKUP_FORMAT, version: 1 });

    expect(messageOf(text)).toContain("does not contain a model");
  });
});

describe("model settings in a backup", () => {
  it("refuses a currency, horizon, name or start month that the forms would refuse", () => {
    expect(messageOf(backupWith({ currency: "XXX" }))).toContain("model settings");

    expect(messageOf(backupWith({ horizonMonths: 13 }))).toContain("horizon");

    expect(messageOf(backupWith({ name: "A" }))).toContain("at least 2 characters");

    expect(messageOf(backupWith({ startMonth: "2026-13" }))).toContain("start month");

    expect(messageOf(backupWith({ revenueMode: "MAGIC" }))).toContain("model settings");
  });

  it("names the field when a setting is missing", () => {
    expect(messageOf(backupWith({ name: undefined }))).toContain('"name"');
  });
});

describe("assumptions in a backup", () => {
  it("refuses assumptions that are missing or damaged", () => {
    expect(messageOf(backupWith({ assumptions: undefined }))).toContain("assumptions");

    expect(messageOf(backupWith({ assumptions: { version: 1 } }))).toContain("assumptions");
  });

  it("refuses a value that is not a plain number and says where it is", () => {
    const assumptions = sampleModel().assumptions;

    const broken = { ...assumptions, general: { ...assumptions.general, startingCash: "lots" } };

    expect(messageOf(backupWith({ assumptions: broken }))).toContain(
      "assumptions.general.startingCash",
    );

    const huge = { ...assumptions, general: { ...assumptions.general, startingCash: "1e400" } };

    expect(messageOf(backupWith({ assumptions: huge }))).toContain("not valid");

    const vast = {
      ...assumptions,
      general: { ...assumptions.general, startingCash: "9999999999999999999" },
    };

    expect(messageOf(backupWith({ assumptions: vast }))).toContain("startingCash");

    const empty = { ...assumptions, general: { ...assumptions.general, corporateTaxRate: "" } };

    expect(messageOf(backupWith({ assumptions: empty }))).toContain("corporateTaxRate");
  });

  it("checks the amounts of custom expenses too", () => {
    const assumptions = sampleModel().assumptions;

    const operating = assumptions.expenses.operatingExpenses;

    const broken = {
      ...assumptions,
      expenses: {
        ...assumptions.expenses,
        operatingExpenses: {
          ...operating,
          custom: [{ id: "c1", name: "Gym", monthlyAmount: "ten" }],
        },
      },
    };

    expect(messageOf(backupWith({ assumptions: broken }))).toContain("monthlyAmount");
  });

  it("allows words in the text fields of custom expenses", () => {
    const assumptions = sampleModel().assumptions;

    const operating = assumptions.expenses.operatingExpenses;

    const fine = {
      ...assumptions,
      expenses: {
        ...assumptions.expenses,
        operatingExpenses: {
          ...operating,
          custom: [{ id: "c1", name: "Team lunches", monthlyAmount: "250" }],
        },
      },
    };

    expect(parseModelBackup(backupWith({ assumptions: fine })).ok).toBe(true);
  });

  it("refuses more custom expenses than a person can add", () => {
    const assumptions = sampleModel().assumptions;

    const operating = assumptions.expenses.operatingExpenses;

    const custom = Array.from({ length: 51 }, (_, index) => ({
      id: `c${index}`,
      name: `Cost ${index}`,
      monthlyAmount: "1",
    }));

    const crowded = {
      ...assumptions,
      expenses: { ...assumptions.expenses, operatingExpenses: { ...operating, custom } },
    };

    expect(messageOf(backupWith({ assumptions: crowded }))).toContain("custom expenses");
  });
});

describe("scenarios in a backup", () => {
  const [base, bull, bear] = sampleModel().scenarios;

  it("refuses a backup without scenarios", () => {
    expect(messageOf(backupWith({ scenarios: [] }))).toContain("no scenarios");

    expect(messageOf(backupWith({ scenarios: undefined }))).toContain("no scenarios");
  });

  it("needs exactly one Base scenario", () => {
    expect(messageOf(backupWith({ scenarios: [bull, bear] }))).toContain("one Base");

    const second = { ...base, name: "Second base" };

    expect(messageOf(backupWith({ scenarios: [base, second] }))).toContain("one Base");
  });

  it("allows only one Bull and one Bear scenario", () => {
    const anotherBull = { ...bull, name: "Another bull" };

    expect(messageOf(backupWith({ scenarios: [base, bull, anotherBull] }))).toContain(
      "only one Bull",
    );

    const anotherBear = { ...bear, name: "Another bear" };

    expect(messageOf(backupWith({ scenarios: [base, bear, anotherBear] }))).toContain(
      "only one Bull and one Bear",
    );
  });

  it("allows custom scenarios", () => {
    const custom = { name: "Price war", type: "CUSTOM", modifiers: { arpuMultiplier: 0.9 } };

    const result = parseModelBackup(backupWith({ scenarios: [base, bull, bear, custom] }));

    expect(result.ok).toBe(true);
  });

  it("refuses names that are too short, repeated or missing", () => {
    expect(messageOf(backupWith({ scenarios: [{ ...base, name: "B" }] }))).toContain("2 to 80");

    expect(messageOf(backupWith({ scenarios: [base, { ...bull, name: "BASE CASE" }] }))).toContain(
      "used twice",
    );

    expect(messageOf(backupWith({ scenarios: [{ ...base, name: undefined }] }))).toContain(
      "2 to 80",
    );
  });

  it("refuses a scenario type that does not exist", () => {
    expect(messageOf(backupWith({ scenarios: [{ ...base, type: "WILD" }] }))).toContain(
      "scenario type",
    );
  });

  it("refuses modifiers outside the limits of the scenario form", () => {
    const wild = { ...bull, modifiers: { ...bull?.modifiers, arpuMultiplier: 9 } };

    expect(messageOf(backupWith({ scenarios: [base, wild] }))).toContain("arpuMultiplier");

    const zero = { ...bull, modifiers: { cacMultiplier: 0 } };

    expect(messageOf(backupWith({ scenarios: [base, zero] }))).toContain("cacMultiplier");

    const text = { ...bull, modifiers: { churnPercentagePointDelta: "a lot" } };

    expect(messageOf(backupWith({ scenarios: [base, text] }))).toContain(
      "churnPercentagePointDelta",
    );
  });

  it("reads modifiers written as numbers in text and drops unknown ones", () => {
    const loose = { ...bull, modifiers: { arpuMultiplier: "1.1", sneaky: 5 } };

    const result = parseModelBackup(backupWith({ scenarios: [base, loose], overrides: [] }));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.model.scenarios[1]?.modifiers).toEqual({ arpuMultiplier: 1.1 });
    }
  });

  it("refuses more scenarios than a model can hold", () => {
    const many = Array.from({ length: MAX_BACKUP_SCENARIOS }, (_, index) => ({
      name: `Custom ${index}`,
      type: "CUSTOM",
      modifiers: {},
    }));

    expect(messageOf(backupWith({ scenarios: [base, ...many] }))).toContain("at most 10");
  });
});

describe("financing events in a backup", () => {
  const events = sampleModel().financingEvents;

  const equity = events.find((event) => event.type === "EQUITY");

  const debt = events.find((event) => event.type === "DEBT");

  it("refuses a loan without an interest rate or a term", () => {
    const noApr = { ...debt, apr: null };

    expect(messageOf(backupWith({ financingEvents: [noApr] }))).toContain("APR is required");

    const noTerm = { ...debt, termMonths: null };

    expect(messageOf(backupWith({ financingEvents: [noTerm] }))).toContain("term is required");
  });

  it("refuses amounts, names, types and months that the form would refuse", () => {
    expect(messageOf(backupWith({ financingEvents: [{ ...equity, amount: "-5" }] }))).toContain(
      "greater than 0",
    );

    expect(messageOf(backupWith({ financingEvents: [{ ...equity, amount: "lots" }] }))).toContain(
      "valid number",
    );

    expect(messageOf(backupWith({ financingEvents: [{ ...equity, name: "x" }] }))).toContain(
      "at least 2 characters",
    );

    expect(messageOf(backupWith({ financingEvents: [{ ...equity, type: "GIFT" }] }))).toContain(
      "Financing event 1",
    );

    expect(messageOf(backupWith({ financingEvents: [{ ...equity, month: "soon" }] }))).toContain(
      "valid financing month",
    );
  });

  it("refuses an event outside the forecast window", () => {
    const early = { ...equity, month: "2020-01" };

    expect(messageOf(backupWith({ financingEvents: [early] }))).toContain(
      "from 2026-10 to 2029-09",
    );

    const late = { ...equity, month: "2029-10" };

    expect(messageOf(backupWith({ financingEvents: [late] }))).toContain("from 2026-10 to 2029-09");
  });

  it("starts repayment after the loan is funded", () => {
    const sameMonth = { ...debt, repaymentStartMonth: debt?.month };

    expect(messageOf(backupWith({ financingEvents: [sameMonth] }))).toContain("or later");
  });

  it("starts repayment the month after funding when none is given", () => {
    const open = { ...debt, month: "2027-03", repaymentStartMonth: null };

    const result = parseModelBackup(backupWith({ financingEvents: [open] }));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.model.financingEvents[0]?.repaymentStartMonth).toBe("2027-04");
    }
  });

  it("drops loan terms from events that are not loans", () => {
    const odd = { ...equity, apr: "5", termMonths: 12, repaymentStartMonth: "2027-01" };

    const result = parseModelBackup(backupWith({ financingEvents: [odd] }));

    expect(result.ok).toBe(true);

    if (result.ok) {
      const [event] = result.model.financingEvents;

      expect(event?.apr).toBe(null);

      expect(event?.termMonths).toBe(null);

      expect(event?.repaymentStartMonth).toBe(null);
    }
  });

  it("refuses values of the wrong type", () => {
    expect(messageOf(backupWith({ financingEvents: [{ ...equity, amount: {} }] }))).toContain(
      "wrong type",
    );

    expect(messageOf(backupWith({ financingEvents: ["text"] }))).toContain("not valid");

    expect(messageOf(backupWith({ financingEvents: "text" }))).toContain("not valid");
  });

  it("refuses too many events", () => {
    const many = Array.from({ length: MAX_BACKUP_FINANCING_EVENTS + 1 }, () => equity);

    expect(messageOf(backupWith({ financingEvents: many }))).toContain("at most 100");
  });
});

describe("month overrides in a backup", () => {
  const overrides = sampleModel().overrides;

  const first = overrides[0];

  it("refuses an override that belongs to a scenario the backup does not have", () => {
    expect(messageOf(backupWith({ overrides: [{ ...first, scenario: "Nowhere" }] }))).toContain(
      "not in this backup",
    );

    expect(messageOf(backupWith({ overrides: [{ ...first, scenario: 7 }] }))).toContain(
      "not in this backup",
    );
  });

  it("refuses a second override for the same month and scenario", () => {
    expect(messageOf(backupWith({ overrides: [first, first] }))).toContain("already an override");
  });

  it("allows the same month for different scenarios", () => {
    const everyone = { ...first, scenario: null };

    const bull = { ...first, scenario: "Bull Case" };

    const bear = { ...first, scenario: "Bear Case" };

    expect(parseModelBackup(backupWith({ overrides: [everyone, bull, bear] })).ok).toBe(true);
  });

  it("refuses a month outside the forecast window", () => {
    expect(messageOf(backupWith({ overrides: [{ ...first, month: "2035-01" }] }))).toContain(
      "from 2026-10 to 2029-09",
    );
  });

  it("refuses an override without any value", () => {
    expect(messageOf(backupWith({ overrides: [{ ...first, values: {} }] }))).toContain(
      "at least one monthly override",
    );

    expect(messageOf(backupWith({ overrides: [{ ...first, values: undefined }] }))).toContain(
      "values are missing",
    );
  });

  it("refuses values that the override form would refuse", () => {
    expect(
      messageOf(backupWith({ overrides: [{ ...first, values: { revenue: "-1" } }] })),
    ).toContain("at least 0");

    expect(
      messageOf(backupWith({ overrides: [{ ...first, values: { churnRate: "101" } }] })),
    ).toContain("not exceed 100");

    expect(
      messageOf(backupWith({ overrides: [{ ...first, values: { arpu: { a: 1 } } }] })),
    ).toContain("wrong type");
  });

  it("refuses a note that is too long", () => {
    expect(messageOf(backupWith({ overrides: [{ ...first, note: "x".repeat(241) }] }))).toContain(
      "at most 240",
    );
  });

  it("keeps only the known value fields", () => {
    const sneaky = { ...first, values: { revenue: "100", hack: "1" } };

    const result = parseModelBackup(backupWith({ overrides: [sneaky] }));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.model.overrides[0]?.values).toEqual({ revenue: "100" });
    }
  });

  it("refuses too many overrides", () => {
    const many = Array.from({ length: MAX_BACKUP_OVERRIDES + 1 }, () => first);

    expect(messageOf(backupWith({ overrides: many }))).toContain("at most 600");
  });
});

describe("findBackupCalculationProblem", () => {
  it("accepts a backup whose scenarios all calculate", () => {
    expect(findBackupCalculationProblem(sampleModel())).toBe(null);
  });

  it("names the scenario that cannot be calculated", () => {
    const broken = { ...sampleModel(), horizonMonths: 13 };

    expect(findBackupCalculationProblem(broken)).toContain('"Base Case"');

    expect(findBackupCalculationProblem(broken)).toContain("could not be calculated");
  });

  it("gives a restored model the same backup and the same forecasts as the original", () => {
    const original = sampleSource();

    const restored = parseModelBackup(JSON.stringify(buildModelBackup(original, EXPORTED_AT)));

    expect(restored.ok).toBe(true);

    if (restored.ok === false) {
      return;
    }

    const rebuilt = sourceFromModel(restored.model);

    expect(buildModelBackup(rebuilt, EXPORTED_AT)).toEqual(buildModelBackup(original, EXPORTED_AT));

    const forecastOf = (source: ModelBackupSource, index: number) =>
      generateFinancialForecast(
        buildFinancialModelInput(
          {
            ...source,
            id: "m",
            modelVersion: "1.0",
            financingEvents: [...source.financingEvents],
            monthlyOverrides: [...source.monthlyOverrides],
          },
          source.scenarios[index],
        ),
      );

    for (const index of [0, 1, 2]) {
      expect(forecastOf(rebuilt, index).months).toEqual(forecastOf(original, index).months);
    }
  });
});

describe("restoredModelName", () => {
  it("keeps the name when the person has no model with it", () => {
    expect(restoredModelName("Acme plan", false)).toBe("Acme plan");
  });

  it("adds a suffix when the name is taken", () => {
    expect(restoredModelName("Acme plan", true)).toBe("Acme plan (restored)");
  });

  it("stays within 100 characters", () => {
    const name = "A".repeat(100);

    const restored = restoredModelName(name, true);

    expect(restored.length).toBeLessThanOrEqual(100);

    expect(restored.endsWith(" (restored)")).toBe(true);
  });
});

describe("backupFilename", () => {
  it("makes a safe file name from the model name", () => {
    expect(backupFilename("Orbit Analytics (sample)")).toBe(
      "venturescope-orbit-analytics-sample-backup.json",
    );

    expect(backupFilename("../../etc/passwd")).toBe("venturescope-etc-passwd-backup.json");

    expect(backupFilename("***")).toBe("venturescope-report-backup.json");
  });
});
