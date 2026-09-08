import {
  dateToMonthKey,
} from "@/lib/finance/dates";
import {
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  parseMonthlyOverrideValues,
} from "@/lib/finance/override-engine";
import type {
  FinancialModelInput,
  FinancialScenarioInput,
  FinancingEventInput,
  FinancingType,
  MonthlyOverrideInput,
  RevenueMode,
  ScenarioType,
} from "@/lib/finance/types";

type StringableValue = {
  toString(): string;
};

type PersistedFinancingEvent = {
  id?: string;

  name: string;

  type:
    | FinancingType
    | string;

  month: Date;

  amount:
    | string
    | number
    | StringableValue;

  apr?:
    | string
    | number
    | StringableValue
    | null;

  termMonths?:
    | number
    | null;

  repaymentStartMonth?:
    | Date
    | null;
};

type PersistedMonthlyOverride = {
  id?: string;

  projectId?: string;

  scenarioId?:
    | string
    | null;

  month: Date;

  values: unknown;

  note?:
    | string
    | null;
};

type PersistedScenario = {
  id?: string;

  name: string;

  type:
    | ScenarioType
    | string;

  modifiers?: unknown;
};

export type PersistedProjectFinancialSource = {
  id: string;

  name: string;

  currency: string;

  startMonth: Date;

  horizonMonths: number;

  revenueMode:
    | RevenueMode
    | string;

  modelVersion: string;

  baseAssumptions: unknown;

  financingEvents?: PersistedFinancingEvent[];

  monthlyOverrides?: PersistedMonthlyOverride[];
};

function asString(
  value:
    | string
    | number
    | StringableValue,
): string {
  return String(
    value,
  );
}

function toRevenueMode(
  value: string,
): RevenueMode {
  if (
    value ===
    "DIRECT"
  ) {
    return "DIRECT";
  }

  if (
    value ===
    "CUSTOMER_DRIVEN"
  ) {
    return "CUSTOMER_DRIVEN";
  }

  throw new Error(
    `Unsupported revenue mode: ${value}`,
  );
}

function toFinancingType(
  value: string,
): FinancingType {
  if (
    value ===
      "EQUITY" ||
    value ===
      "DEBT" ||
    value ===
      "GRANT" ||
    value ===
      "OTHER"
  ) {
    return value;
  }

  throw new Error(
    `Unsupported financing type: ${value}`,
  );
}

function toScenarioType(
  value: string,
): ScenarioType {
  if (
    value ===
      "BASE" ||
    value ===
      "BULL" ||
    value ===
      "BEAR" ||
    value ===
      "CUSTOM"
  ) {
    return value;
  }

  throw new Error(
    `Unsupported scenario type: ${value}`,
  );
}

function mapFinancingEvent(
  event: PersistedFinancingEvent,
): FinancingEventInput {
  return {
    id:
      event.id,

    name:
      event.name,

    type:
      toFinancingType(
        event.type,
      ),

    month:
      dateToMonthKey(
        event.month,
      ),

    amount:
      asString(
        event.amount,
      ),

    apr:
      event.apr ===
        null ||
      event.apr ===
        undefined
        ? null
        : asString(
            event.apr,
          ),

    termMonths:
      event.termMonths ??
      null,

    repaymentStartMonth:
      event.repaymentStartMonth
        ? dateToMonthKey(
            event.repaymentStartMonth,
          )
        : null,
  };
}

function mapMonthlyOverride(
  override: PersistedMonthlyOverride,
): MonthlyOverrideInput {
  return {
    id:
      override.id,

    projectId:
      override.projectId,

    scenarioId:
      override.scenarioId ??
      null,

    month:
      dateToMonthKey(
        override.month,
      ),

    values:
      parseMonthlyOverrideValues(
        override.values,
      ),

    note:
      override.note ??
      null,
  };
}

export function mapPersistedScenario(
  scenario: PersistedScenario,
): FinancialScenarioInput {
  return {
    id:
      scenario.id,

    name:
      scenario.name,

    type:
      toScenarioType(
        scenario.type,
      ),

    modifiers:
      scenario.modifiers ??
      {},
  };
}

export function buildFinancialModelInput(
  project: PersistedProjectFinancialSource,
  scenario?: PersistedScenario,
): FinancialModelInput {
  return {
    projectId:
      project.id,

    projectName:
      project.name,

    currency:
      project.currency,

    startMonth:
      dateToMonthKey(
        project.startMonth,
      ),

    horizonMonths:
      project.horizonMonths,

    revenueMode:
      toRevenueMode(
        project.revenueMode,
      ),

    modelVersion:
      project.modelVersion,

    assumptions:
      parseStoredFinancialAssumptions(
        project.baseAssumptions,
      ),

    financingEvents:
      (
        project.financingEvents ??
        []
      ).map(
        mapFinancingEvent,
      ),

    monthlyOverrides:
      (
        project.monthlyOverrides ??
        []
      ).map(
        mapMonthlyOverride,
      ),

    scenario:
      scenario
        ? mapPersistedScenario(
            scenario,
          )
        : undefined,
  };
}
