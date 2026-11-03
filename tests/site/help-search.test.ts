import { describe, expect, it } from "vitest";

import { GLOSSARY, HELP_GROUPS } from "@/lib/site/help-content";
import {
  countHelpItems,
  filterGlossary,
  filterHelpGroups,
  matchesWords,
  searchWords,
} from "@/lib/site/help-search";

const TOTAL = HELP_GROUPS.reduce((sum, group) => sum + group.items.length, 0);

function itemIds(query: string): string[] {
  return filterHelpGroups(HELP_GROUPS, query).flatMap((group) =>
    group.items.map((item) => item.id),
  );
}

describe("searchWords", () => {
  it("lower-cases and splits on any spaces", () => {
    expect(searchWords("  Recovery   KEY ")).toEqual(["recovery", "key"]);
  });

  it("gives no words for an empty search", () => {
    expect(searchWords("")).toEqual([]);

    expect(searchWords("   ")).toEqual([]);
  });
});

describe("matchesWords", () => {
  it("needs every word, in any order, in any case", () => {
    expect(matchesWords("The Recovery Key changes", ["key", "recovery"])).toBe(true);

    expect(matchesWords("The Recovery Key changes", ["key", "runway"])).toBe(false);
  });

  it("accepts any text when there are no words", () => {
    expect(matchesWords("anything", [])).toBe(true);
  });
});

describe("filterHelpGroups", () => {
  it("returns every answer for an empty search", () => {
    expect(countHelpItems(filterHelpGroups(HELP_GROUPS, ""))).toBe(TOTAL);

    expect(countHelpItems(filterHelpGroups(HELP_GROUPS, "   "))).toBe(TOTAL);
  });

  it("finds the runway answer", () => {
    expect(itemIds("runway")).toContain("runway");

    expect(itemIds("RUNWAY")).toContain("runway");
  });

  it("uses every word of the search", () => {
    expect(itemIds("recovery key")).toContain("recovery-key");

    expect(itemIds("recovery zzzz")).toEqual([]);
  });

  it("drops topics that have no matching answer", () => {
    const groups = filterHelpGroups(HELP_GROUPS, "invitation");

    expect(groups.map((group) => group.id)).toContain("working-with-other-people");

    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it("shows the whole topic when the topic title matches", () => {
    const account = HELP_GROUPS.find((group) => group.id === "account-and-security");

    expect(account === undefined).toBe(false);

    const found = filterHelpGroups(HELP_GROUPS, "security").find(
      (group) => group.id === "account-and-security",
    );

    expect(found?.items.length).toBe(account?.items.length);
  });

  it("finds every answer by its own question", () => {
    for (const group of HELP_GROUPS) {
      for (const item of group.items) {
        expect(itemIds(item.question)).toContain(item.id);
      }
    }
  });

  it("does not change the original data", () => {
    const before = JSON.stringify(HELP_GROUPS);

    filterHelpGroups(HELP_GROUPS, "runway");

    filterHelpGroups(HELP_GROUPS, "nothing matches this");

    expect(JSON.stringify(HELP_GROUPS)).toBe(before);
  });

  it("returns nothing when no answer matches", () => {
    expect(countHelpItems(filterHelpGroups(HELP_GROUPS, "qqqqqq"))).toBe(0);
  });
});

describe("filterGlossary", () => {
  it("returns every term for an empty search", () => {
    expect(filterGlossary(GLOSSARY, "")).toHaveLength(GLOSSARY.length);
  });

  it("finds a term by its name or by its meaning", () => {
    expect(filterGlossary(GLOSSARY, "runway").map((entry) => entry.term)).toContain("Runway");

    expect(filterGlossary(GLOSSARY, "stop paying").map((entry) => entry.term)).toContain("Churn");
  });

  it("finds every term by its own name", () => {
    for (const entry of GLOSSARY) {
      expect(filterGlossary(GLOSSARY, entry.term).map((found) => found.term)).toContain(entry.term);
    }
  });

  it("returns nothing for a word that is not there", () => {
    expect(filterGlossary(GLOSSARY, "qqqqqq")).toHaveLength(0);
  });
});
