import { describe, expect, it } from "vitest";

import {
  describeIssueLimit,
  describeIssueToggle,
  FEWEST_ISSUES_HIDDEN,
  FIRST_ISSUES_SHOWN,
  issuesInView,
  MOST_ISSUES_SHOWN,
} from "@/lib/data-import/issue-list";
import { validateDataImportCsv } from "@/lib/data-import/validation";

/** An Actuals file with one bad number in each of its months. */
function badMonths(count: number): string {
  const lines = ["period,revenue"];

  for (let index = 0; index < count; index += 1) {
    const year = 2027 + Math.floor(index / 12);

    const month = String((index % 12) + 1).padStart(2, "0");

    lines.push(`${year}-${month},abc`);
  }

  return lines.join("\n");
}

/** The number of issues that the screen lists for a file with this many issues. */
function listedFor(issueCount: number): number {
  return Math.min(issueCount, MOST_ISSUES_SHOWN);
}

describe("the numbers of the list of issues", () => {
  it("lists 50, shows 10 first on a phone, and never hides fewer than 3", () => {
    expect(MOST_ISSUES_SHOWN).toBe(50);

    expect(FIRST_ISSUES_SHOWN).toBe(10);

    expect(FEWEST_ISSUES_HIDDEN).toBe(3);
  });
});

describe("the sentence about a cut list of issues", () => {
  it("says nothing when every issue is listed", () => {
    for (const total of [0, 1, 2, 49, 50]) {
      expect(describeIssueLimit(total), String(total)).toBe(null);
    }
  });

  it("tells how many are listed and how many there are when the list is cut", () => {
    expect(describeIssueLimit(51)).toBe(
      "Only the first 50 of 51 issues are listed. Fix these, then choose the file again to see the others.",
    );

    expect(describeIssueLimit(60)).toBe(
      "Only the first 50 of 60 issues are listed. Fix these, then choose the file again to see the others.",
    );

    expect(describeIssueLimit(120)).toBe(
      "Only the first 50 of 120 issues are listed. Fix these, then choose the file again to see the others.",
    );
  });

  it("uses the limit of the list, not a number of its own", () => {
    expect(describeIssueLimit(MOST_ISSUES_SHOWN)).toBe(null);

    expect(describeIssueLimit(MOST_ISSUES_SHOWN + 1)).toBe(
      `Only the first ${MOST_ISSUES_SHOWN} of ${MOST_ISSUES_SHOWN + 1} issues are listed. Fix these, then choose the file again to see the others.`,
    );
  });

  it("does not say that it is showing them, because a phone may show only the first 10", () => {
    const sentence = describeIssueLimit(60) ?? "";

    expect(sentence.includes("Showing")).toBe(false);

    expect(sentence.startsWith("Only the first 50 of 60")).toBe(true);
  });
});

describe("how many issues the list on a phone shows", () => {
  it("shows all of a short list, opened or not", () => {
    for (let listed = 0; listed <= 12; listed += 1) {
      expect(issuesInView(listed, false), `${listed} closed`).toBe(listed);

      expect(issuesInView(listed, true), `${listed} opened`).toBe(listed);
    }
  });

  it("shows the first 10 of a longer list until the person asks for the others", () => {
    for (let listed = 13; listed <= 50; listed += 1) {
      expect(issuesInView(listed, false), `${listed} closed`).toBe(10);

      expect(issuesInView(listed, true), `${listed} opened`).toBe(listed);
    }
  });

  it("changes at 13, the first list where the button hides 3", () => {
    expect(issuesInView(12, false)).toBe(12);

    expect(issuesInView(13, false)).toBe(10);

    expect(FIRST_ISSUES_SHOWN + FEWEST_ISSUES_HIDDEN).toBe(13);
  });

  it("never hides just 1 or 2 issues", () => {
    for (let listed = 0; listed <= 50; listed += 1) {
      const hidden = listed - issuesInView(listed, false);

      expect(hidden === 0 || hidden >= FEWEST_ISSUES_HIDDEN, `${listed} lists`).toBe(true);
    }
  });
});

describe("the words on the button under the list on a phone", () => {
  it("has no button for a short list", () => {
    for (let listed = 0; listed <= 12; listed += 1) {
      expect(describeIssueToggle(listed, false), `${listed} closed`).toBe(null);

      expect(describeIssueToggle(listed, true), `${listed} opened`).toBe(null);
    }
  });

  it("tells how many more issues it shows when the list is closed", () => {
    expect(describeIssueToggle(13, false)).toBe("Show 3 more issues");

    expect(describeIssueToggle(14, false)).toBe("Show 4 more issues");

    expect(describeIssueToggle(30, false)).toBe("Show 20 more issues");

    expect(describeIssueToggle(50, false)).toBe("Show 40 more issues");
  });

  it("offers to make the list short again when it is open", () => {
    for (const listed of [13, 14, 30, 50]) {
      expect(describeIssueToggle(listed, true), String(listed)).toBe("Show fewer issues");
    }
  });

  it("counts the issues that the list holds, so the button and the list agree", () => {
    for (let listed = 13; listed <= 50; listed += 1) {
      const hidden = listed - issuesInView(listed, false);

      expect(describeIssueToggle(listed, false), String(listed)).toBe(`Show ${hidden} more issues`);
    }
  });
});

describe("a real file with issues", () => {
  it("has 60 issues, lists 50 of them and has a button that shows 40", () => {
    const issues = validateDataImportCsv({
      importType: "ACTUALS",
      csv: badMonths(60),
    }).issues;

    expect(issues.length).toBe(60);

    expect(describeIssueLimit(issues.length)).toBe(
      "Only the first 50 of 60 issues are listed. Fix these, then choose the file again to see the others.",
    );

    expect(issuesInView(listedFor(issues.length), false)).toBe(10);

    expect(describeIssueToggle(listedFor(issues.length), false)).toBe("Show 40 more issues");
  });

  it("has 3 issues, a list with no sentence and no button", () => {
    const issues = validateDataImportCsv({
      importType: "ACTUALS",
      csv: badMonths(3),
    }).issues;

    expect(issues.length).toBe(3);

    expect(describeIssueLimit(issues.length)).toBe(null);

    expect(issuesInView(listedFor(issues.length), false)).toBe(3);

    expect(describeIssueToggle(listedFor(issues.length), false)).toBe(null);
  });

  it("has exactly 50 issues, a button and no sentence about a cut list", () => {
    const issues = validateDataImportCsv({
      importType: "ACTUALS",
      csv: badMonths(50),
    }).issues;

    expect(issues.length).toBe(50);

    expect(describeIssueLimit(issues.length)).toBe(null);

    expect(describeIssueToggle(listedFor(issues.length), false)).toBe("Show 40 more issues");
  });

  it("has 13 issues, the shortest list with a button", () => {
    const issues = validateDataImportCsv({
      importType: "ACTUALS",
      csv: badMonths(13),
    }).issues;

    expect(issues.length).toBe(13);

    expect(describeIssueLimit(issues.length)).toBe(null);

    expect(describeIssueToggle(listedFor(issues.length), false)).toBe("Show 3 more issues");
  });

  it("has 12 issues, the longest list with no button", () => {
    const issues = validateDataImportCsv({
      importType: "ACTUALS",
      csv: badMonths(12),
    }).issues;

    expect(issues.length).toBe(12);

    expect(describeIssueToggle(listedFor(issues.length), false)).toBe(null);
  });
});
