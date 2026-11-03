import { addMonths } from "@/lib/finance/dates";
import { dateToMonthInput } from "@/lib/projects/project-dates";

/**
 * The people, names and dates of the demo data. Nothing in this file touches the database, so the
 * tests can read it and the seed and the check can share it.
 */

/** Every demo account has this password. It is printed at the end of the seed. */
export const DEMO_PASSWORD = "Orbit-Demo-2026-Plan";

export type DemoPersonKey = "owner" | "finance" | "investor";

export type DemoPerson = {
  key: DemoPersonKey;

  name: string;

  email: string;

  /** The role in the demo workspace. The owner owns the workspace, so there is no member row. */
  role: "OWNER" | "EDITOR" | "VIEWER";

  /** What the person does in the story, for the printed list of accounts. */
  story: string;
};

/** The addresses end with .test, a name that can never be a real mailbox. */
export const DEMO_PEOPLE: Record<DemoPersonKey, DemoPerson> = {
  owner: {
    key: "owner",
    name: "Alex Morgan",
    email: "demo@venturescope.test",
    role: "OWNER",
    story: "founder, owns the workspace and the model, approves requests",
  },

  finance: {
    key: "finance",
    name: "Sam Rivera",
    email: "sam.rivera@venturescope.test",
    role: "EDITOR",
    story: "finance lead, can edit, imports the numbers and asks for approvals",
  },

  investor: {
    key: "investor",
    name: "Jordan Lee",
    email: "jordan.lee@venturescope.test",
    role: "VIEWER",
    story: "investor, can only read",
  },
};

export const DEMO_PERSON_KEYS: DemoPersonKey[] = ["owner", "finance", "investor"];

export const DEMO_WORKSPACE_NAME = "Orbit Analytics";

export const DEMO_MODEL_NAME_PREFIX = "Orbit Analytics";

/** "Orbit Analytics 2026 plan". The year is the year of the first month of the model. */
export function demoModelName(startMonth: string): string {
  return `${DEMO_MODEL_NAME_PREFIX} ${startMonth.slice(0, 4)} plan`;
}

export const DEMO_MODEL_INDUSTRY = "B2B SaaS";

/** How many months of real numbers the model has. The month after them is the current month. */
export const DEMO_ACTUAL_MONTHS = 9;

/** How many of those months are closed. The newest months stay open, like in a real company. */
export const DEMO_CLOSED_MONTHS = 6;

export type DemoTimeline = {
  /** The month of "today", "YYYY-MM". It has no numbers yet. */
  currentMonth: string;

  /** The first month of the model. */
  startMonth: string;

  /** Months with numbers, oldest first. */
  actualMonths: string[];

  /** Months that are closed, oldest first. */
  closedMonths: string[];

  /** The newest month with numbers. */
  latestActualMonth: string;
};

export function demoTimeline(now: Date): DemoTimeline {
  const currentMonth = dateToMonthInput(now);

  const startMonth = addMonths(currentMonth, -DEMO_ACTUAL_MONTHS);

  const actualMonths = Array.from({ length: DEMO_ACTUAL_MONTHS }, (_, index) =>
    addMonths(startMonth, index),
  );

  return {
    currentMonth,
    startMonth,
    actualMonths,
    closedMonths: actualMonths.slice(0, DEMO_CLOSED_MONTHS),
    latestActualMonth: actualMonths[actualMonths.length - 1],
  };
}

export type SeedTargetCheck =
  | { ok: true; host: string; remote: boolean }
  | { ok: false; host: string; remote: boolean; reason: string };

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]", "host.docker.internal"];

/**
 * The seed deletes and recreates the demo accounts. On a database on this computer that is always
 * fine. On any other database, or when NODE_ENV is production, a person must say yes on purpose.
 */
export function checkSeedTarget({
  databaseUrl,
  nodeEnv,
  allowRemote,
}: {
  databaseUrl: string;

  nodeEnv: string | undefined;

  allowRemote: string | undefined;
}): SeedTargetCheck {
  let host = "";

  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    return {
      ok: false,
      host: "unknown",
      remote: true,
      reason: "DATABASE_URL is not a valid address.",
    };
  }

  const remote = LOCAL_HOSTS.includes(host) === false;

  const production = nodeEnv === "production";

  if ((remote || production) && allowRemote !== "yes") {
    return {
      ok: false,
      host,
      remote,
      reason:
        "This is not a database on your own computer (or NODE_ENV is production). " +
        "The seed deletes and recreates the three demo accounts. " +
        "If you are sure, run it again with VS_SEED_ALLOW_REMOTE=yes.",
    };
  }

  return { ok: true, host, remote };
}
