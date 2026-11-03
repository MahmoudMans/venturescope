import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const listText = read("components/data-import/import-issue-list.tsx");

const list = squash(listText);

const helperText = read("lib/data-import/issue-list.ts");

const helper = squash(helperText);

const workbenchText = read("components/data-import/data-import-workbench.tsx");

const workbench = squash(workbenchText);

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

describe("the numbers and the words of the list", () => {
  it("has one limit of 50, a first part of 10 and a fewest-hidden of 3", () => {
    expect(helper).toContain("exportconstMOST_ISSUES_SHOWN=50;");

    expect(helper).toContain("exportconstFIRST_ISSUES_SHOWN=10;");

    expect(helper).toContain("exportconstFEWEST_ISSUES_HIDDEN=3;");
  });

  it("tells that the list is cut with words that stay true when a phone shows only 10", () => {
    expect(helper).toContain("if(total<=MOST_ISSUES_SHOWN){returnnull;}");

    expect(helper).toContain(
      "`Onlythefirst${MOST_ISSUES_SHOWN}of${total}issuesarelisted.Fixthese,thenchoosethefileagaintoseetheothers.`;",
    );

    expect(helper).not.toContain("`Showingthefirst");
  });

  it("folds a list only when the button hides at least 3 issues", () => {
    expect(helper).toContain("returnlisted>=FIRST_ISSUES_SHOWN+FEWEST_ISSUES_HIDDEN;");

    expect(helper).toContain(
      "if(isFolded(listed)&&expanded===false){returnFIRST_ISSUES_SHOWN;}returnlisted;",
    );
  });

  it("gives words for the button only when there is a fold", () => {
    expect(helper).toContain(
      'if(isFolded(listed)===false){returnnull;}if(expanded){return"Showfewerissues";}return`Show${listed-FIRST_ISSUES_SHOWN}moreissues`;',
    );
  });

  it("uses only plain ASCII characters", () => {
    expect(/^[\x00-\x7f]*$/.test(helperText)).toBe(true);

    expect(/^[\x00-\x7f]*$/.test(listText)).toBe(true);
  });
});

describe("the state of the list", () => {
  it("is a client component with a list that starts closed", () => {
    expect(listText.startsWith('"use client";\n')).toBe(true);

    expect(list).toContain("const[expanded,setExpanded]=useState(false);");

    expect(list).toContain('import{useEffect,useRef,useState}from"react";');
  });

  it("starts short again when the file has new issues", () => {
    expect(list).toContain("const[seen,setSeen]=useState(issues);");

    expect(list).toContain("if(seen!==issues){setSeen(issues);setExpanded(false);}");
  });

  it("takes the numbers of the blocks and of the button from the helper", () => {
    expect(list).toContain("constshown=issues.slice(0,MOST_ISSUES_SHOWN);");

    expect(list).toContain("constinView=shown.slice(0,issuesInView(shown.length,expanded));");

    expect(list).toContain("constlimit=describeIssueLimit(issues.length);");

    expect(list).toContain("consttoggle=describeIssueToggle(shown.length,expanded);");

    expect(list).toContain(
      'import{describeIssueLimit,describeIssueToggle,issuesInView,MOST_ISSUES_SHOWN,}from"@/lib/data-import/issue-list";',
    );
  });

  it("brings the button back into view when the open list is made short", () => {
    expect(list).toContain(
      'useEffect(()=>{if(expanded===false&&foldedByButton.current){foldedByButton.current=false;buttonBox.current?.scrollIntoView({block:"end"});}},[expanded]);',
    );

    expect(list).toContain("constbuttonBox=useRef<HTMLDivElement>(null);");

    expect(list).toContain("constfoldedByButton=useRef(false);");
  });
});

describe("the list of issues", () => {
  it("tells that the list is cut, and counts all the issues", () => {
    expect(list).toContain('<pdata-slot="import-issue-limit"');

    expect(list).toContain("{limit}");

    expect(list).toContain("{limit===null?null:(");
  });

  it("keeps the table in the box that scrolls with the keyboard, and the blocks outside of it", () => {
    expect(list).toContain(
      '<divdata-slot="import-issue-table-box"className="hiddenxl:block"><ScrollRegionlabel="Validationissues"className="max-h-72overflow-y-auto">',
    );

    expect(list.indexOf("</ul>")).toBeGreaterThan(-1);

    expect(list.indexOf("</ul>")).toBeLessThan(list.indexOf("<ScrollRegion"));
  });

  it("is made of blocks below the wide screen, with the row and the field above the message", () => {
    expect(list).toContain('<uldata-slot="import-issue-list"className="divide-ytext-smxl:hidden">');

    expect(list).toContain('<spanclassName="font-medium">Row{issue.row}</span>');

    expect(list).toContain(
      '<spanclassName="font-monotext-xstext-muted-foreground">{issue.field}</span>',
    );

    expect(list).toContain('<pclassName="break-wordstext-destructive">{issue.message}</p>');
  });

  it("lets the row and the field go to two lines on a narrow phone", () => {
    expect(list).toContain('<pclassName="flexflex-wrapitems-baselinegap-x-2">');
  });

  it("has the same frame as the other cards of the screen", () => {
    expect(list).toContain('<sectionclassName="rounded-lgborder"><divclassName="border-bp-4">');

    expect(list).toContain('<h3className="font-semibold">Validationissues</h3>');
  });

  it("is a table on a wide screen, with the same three columns as before", () => {
    expect(list).toContain(
      '<tabledata-slot="import-issue-table"className="w-fullmin-w-[650px]text-sm">',
    );

    expect(list).toContain('<thclassName="px-3py-2text-left">Row</th>');

    expect(list).toContain('<thclassName="px-3py-2text-left">Field</th>');

    expect(list).toContain('<thclassName="px-3py-2text-left">Issue</th>');

    expect(list).toContain('<tdclassName="px-3py-2">{issue.row}</td>');

    expect(list).toContain('<tdclassName="px-3py-2font-monotext-xs">{issue.field}</td>');

    expect(list).toContain('<tdclassName="px-3py-2text-destructive">{issue.message}</td>');
  });

  it("gives the blocks the first issues and the table every issue that is listed", () => {
    expect(listText.split("inView.map(").length - 1).toBe(1);

    expect(listText.split("shown.map(").length - 1).toBe(1);

    expect(list.indexOf("inView.map(")).toBeLessThan(list.indexOf("</ul>"));

    expect(list.indexOf("shown.map(")).toBeGreaterThan(list.indexOf("<ScrollRegion"));
  });

  it("gives each issue a key", () => {
    expect(listText.split("key={`${issue.row}:${issue.field}:${index}`}").length - 1).toBe(2);
  });
});

describe("the button under the list", () => {
  it("is shown only when there is a fold, and only below the wide screen", () => {
    expect(list).toContain("{toggle===null?null:(");

    expect(list).toContain(
      '<divref={buttonBox}data-slot="import-issue-toggle"className="border-tp-3xl:hidden">',
    );
  });

  it("is a full-width button that does not send a form", () => {
    expect(list).toContain(
      '<Buttontype="button"variant="outline"size="lg"className="w-full"onClick={()=>{foldedByButton.current=expanded;setExpanded(expanded===false);}}>',
    );
  });

  it("has an arrow that points up when the list is open, and the words from the helper", () => {
    expect(list).toContain(
      '<ChevronDownaria-hidden="true"className={expanded?"rotate-180":undefined}/>{toggle}',
    );

    expect(list).toContain('import{ChevronDown}from"lucide-react";');

    expect(list).toContain('import{Button}from"@/components/ui/button";');
  });

  it("switches at the width where the side menu leaves room for the table", () => {
    expect(listText.split("xl:hidden").length - 1).toBe(2);

    expect(listText.split("xl:block").length - 1).toBe(1);

    expect(listText).not.toContain("md:hidden");
  });
});

describe("the import screen", () => {
  it("shows the list for a file that has issues, once", () => {
    expect(workbenchText.split("<ImportIssueList").length - 1).toBe(1);

    expect(workbench).toContain("<ImportIssueListissues={validation.result.issues}/>");

    expect(workbench).toContain(
      'import{ImportIssueList,}from"@/components/data-import/import-issue-list";',
    );
  });

  it("no longer has its own table of issues or its own limit", () => {
    expect(workbenchText).not.toContain("min-w-[650px]");

    expect(workbench).not.toContain(".issues.slice(");

    expect(workbench).not.toContain('<h3className="font-semibold">Validationissues</h3>');
  });

  it("has the preview and the history in components of their own, with no table left", () => {
    expect(workbenchText).not.toContain('<ScrollRegion label="Preview">');

    expect(workbenchText).not.toContain('<ScrollRegion label="Import history">');
  });
});

describe("the README", () => {
  const phone = readmeSection("Problems you can read on a phone");

  const ten = readmeSection("Ten problems first on a phone");

  it("still explains the table and the blocks of the list", () => {
    for (const piece of [
      "The list of problems in the Data Import Center was a table 650px wide",
      "244px (a 320px phone), 284px (360px) or 314px (390px)",
      "25%, 32% and 38%",
      "3%, 13% and 20%",
      "The list also showed the first 50 problems and did not say so",
      "`components/data-import/import-issue-list.tsx` shows each problem as a block",
      "so nothing scrolls sideways",
      "From 1024px the side menu takes 256px",
      "Table from 1280px",
      "The other one has `display: none`, so a screen reader reads each problem once",
      "the Tab key does not stop on a hidden box",
      "No box in a box",
      "do not scroll in a box of their own",
      "and a phone first shows 10 of them",
      "`MOST_ISSUES_SHOWN`",
      "Only the first 50 of 60 issues are listed. Fix these, then choose the file again to see the others.",
      "It is shown only when there are more than 50 problems",
      '(`ScrollRegion`, named "Validation issues")',
      "the preview of the first rows and the import history were still wide tables",
      "320px, 360px, 390px, 768px, 1024px and 1280px",
      "the migration count stays at 17",
    ]) {
      expect(squash(phone).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("no longer tells the old words of the sentence about the limit", () => {
    expect(phone).not.toContain("Showing the first 50 of 60 issues. Fix these");
  });

  it("explains the fold, the button, the numbers and the limits", () => {
    for (const piece of [
      "With 50 problems, the list on a phone was 3108px of page",
      "10 problems are 668px and 13 are 851px",
      "**First 10, then a button:**",
      "**Not for a short list:**",
      "**The button:**",
      "**Back to the button:**",
      "**Wide screens:**",
      "**The sentence about the limit:**",
      "the first 10 problems and a button under them",
      '"Show 40 more issues"',
      '"Show fewer issues"',
      "737px tall on a 320px, 360px or 390px phone",
      "between 773px and 789px with the note about the limit of 50",
      "a list of 12 problems or fewer is shown whole",
      "`FIRST_ISSUES_SHOWN` (10)",
      "`FEWEST_ISSUES_HIDDEN` (3)",
      "44px tall on a touch screen and 40px with a mouse",
      "the screen stayed 2451px down",
      "the button is scrolled back into view",
      "A new file starts short",
      "from 1280px the table shows every problem that is listed (up to 50)",
      "the button has `display: none`",
      '"Showing the first 50 of 60 issues.", which is not true when a phone shows 10',
      '"Only the first 50 of 60 issues are listed."',
      "the fold is not remembered after a reload",
      "320px, 360px, 390px, 768px and 1280px",
      "the migration count stays at 17",
    ]) {
      expect(squash(ten).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its two test files", () => {
    for (const name of [
      "tests/data-import/issue-list.test.ts",
      "tests/data-import/issue-list-source.test.ts",
    ]) {
      expect(ten, name).toContain(`\`${name}\``);
    }
  });

  it("comes after the section about problems on a phone and before the download section", () => {
    const before = readme.indexOf("## Problems you can read on a phone");

    const here = readme.indexOf("## Ten problems first on a phone");

    const download = readme.indexOf("## Download your data");

    expect(before).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(before);

    expect(download).toBeGreaterThan(here);
  });
});
