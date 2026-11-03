import { describe, expect, it } from "vitest";

import { DATA_EXPORT_LEFT_OUT_NOTE } from "@/lib/account/data-export-info";
import { DATA_IMPORT_MAX_BYTES, DATA_IMPORT_MAX_ROWS } from "@/lib/data-import/catalog";
import { formatRunway } from "@/lib/finance/formatting";
import { PROJECT_CURRENCY_VALUES, PROJECT_HORIZONS } from "@/lib/projects/project-options";
import { GLOSSARY, HELP_GROUPS } from "@/lib/site/help-content";
import { invitationExpiry } from "@/lib/workspaces/invitations";
import { workspaceRoleDescription } from "@/lib/workspaces/labels";

const ITEMS = HELP_GROUPS.flatMap((group) => group.items);

function answerText(id: string): string {
  const item = ITEMS.find((candidate) => candidate.id === id);

  if (item === undefined) {
    throw new Error(`No help item with id ${id}`);
  }

  return item.answer.join(" ");
}

describe("help content structure", () => {
  it("gives every topic and every answer its own web-safe id", () => {
    const ids = [...HELP_GROUPS.map((group) => group.id), ...ITEMS.map((item) => item.id)];

    expect(new Set(ids).size).toBe(ids.length);

    expect(ids.includes("glossary")).toBe(false);

    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("has six topics with at least two answers each", () => {
    expect(HELP_GROUPS).toHaveLength(6);

    for (const group of HELP_GROUPS) {
      expect(group.title.length).toBeGreaterThan(3);

      expect(group.summary.endsWith(".")).toBe(true);

      expect(group.items.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("writes every question as a question and every answer as full sentences", () => {
    for (const item of ITEMS) {
      expect(item.question.endsWith("?")).toBe(true);

      expect(item.answer.length).toBeGreaterThan(0);

      for (const paragraph of item.answer) {
        expect(paragraph).toBe(paragraph.trim());

        expect(paragraph.length).toBeGreaterThan(20);

        expect(/[.?]$|\)$/.test(paragraph)).toBe(true);
      }
    }
  });

  it("never promises a feature for later", () => {
    const everything = ITEMS.map((item) => `${item.question} ${item.answer.join(" ")}`).join(" ");

    expect(everything).not.toMatch(/coming soon|comes later|will come|not yet|lorem|todo/i);
  });
});

describe("help content stays true to the app", () => {
  it("lists every currency and every forecast length the app accepts", () => {
    const text = answerText("currencies-and-length");

    for (const currency of PROJECT_CURRENCY_VALUES) {
      expect(text).toContain(currency);
    }

    for (const months of PROJECT_HORIZONS) {
      expect(text).toContain(String(months));
    }
  });

  it("states the real import limits", () => {
    const text = answerText("import-csv");

    expect(text).toContain(`${DATA_IMPORT_MAX_BYTES / 1024} KB`);

    expect(text).toContain(`${DATA_IMPORT_MAX_ROWS.ACTUALS} rows`);

    expect(text).toContain(`${DATA_IMPORT_MAX_ROWS.KPI_TARGETS} rows`);
  });

  it("repeats the role descriptions from the workspace pages", () => {
    const text = answerText("roles");

    for (const role of ["OWNER", "EDITOR", "VIEWER"]) {
      expect(text).toContain(workspaceRoleDescription(role));
    }
  });

  it("says invitation links last as long as they really do", () => {
    const start = Date.parse("2027-01-01T00:00:00.000Z");

    const days = Math.round((invitationExpiry(new Date(start)).getTime() - start) / 86400000);

    expect(days).toBeGreaterThan(0);

    expect(answerText("invitations")).toContain(`${days} days`);
  });

  it("uses the same runway words as the forecast pages", () => {
    const text = answerText("runway");

    const beyond = formatRunway({
      status: "BEYOND_HORIZON",
      months: null,
      exhaustedMonth: null,
      horizonMonths: 36,
    });

    const positive = formatRunway({
      status: "CASH_FLOW_POSITIVE",
      months: null,
      exhaustedMonth: null,
      horizonMonths: 36,
    });

    expect(beyond).toBe(">36 mo");

    expect(text).toContain(beyond);

    expect(text).toContain(positive);
  });

  it("explains how to get back into an account without email", () => {
    expect(answerText("recovery-key")).toContain("sends no emails");

    expect(answerText("recovery-key")).toContain("cannot be reset by email");

    expect(answerText("forgot-password")).toContain("cannot be recovered");

    expect(answerText("delete-account")).toContain("download a copy of your data");
  });

  it("explains the data download and where to find it", () => {
    const text = answerText("download-your-data");

    expect(text).toContain("Account, then Profile");

    expect(text).toContain("Download my data");

    expect(text).toContain("ZIP file");

    expect(text).toContain("never included");

    expect(text).toContain(DATA_EXPORT_LEFT_OUT_NOTE);
  });
});

describe("glossary", () => {
  it("has unique terms in alphabetical order", () => {
    const terms = GLOSSARY.map((entry) => entry.term);

    expect(new Set(terms.map((term) => term.toLowerCase())).size).toBe(terms.length);

    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b)));
  });

  it("explains each term in one short sentence", () => {
    for (const entry of GLOSSARY) {
      expect(entry.term.length).toBeGreaterThan(1);

      expect(entry.meaning.endsWith(".")).toBe(true);

      expect(entry.meaning.length).toBeGreaterThan(20);
    }
  });

  it("covers the words that the forecast pages use", () => {
    const terms = GLOSSARY.map((entry) => entry.term);

    for (const word of ["Runway", "Burn", "MRR", "ARR", "EBITDA", "Churn", "Variance"]) {
      expect(terms).toContain(word);
    }
  });
});
