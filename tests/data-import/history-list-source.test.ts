import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const listText = read("components/data-import/import-history-list.tsx");

const list = squash(listText);

const helperText = read("lib/data-import/history-list.ts");

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

describe("the numbers and the words of the history", () => {
  it("has the numbers of the fold", () => {
    expect(helper).toContain("exportconstFIRST_ATTEMPTS_SHOWN=3;");

    expect(helper).toContain("exportconstFEWEST_ATTEMPTS_HIDDEN=3;");
  });

  it("folds a history only when the button hides at least three attempts", () => {
    expect(helper).toContain("returntotal>=FIRST_ATTEMPTS_SHOWN+FEWEST_ATTEMPTS_HIDDEN;");

    expect(helper).toContain(
      "returnisFolded(total)&&expanded===false&&index>=FIRST_ATTEMPTS_SHOWN;",
    );
  });

  it("gives words for the button only when there is a fold, with 'attempt' for one", () => {
    expect(helper).toContain(
      'if(isFolded(total)===false){returnnull;}if(expanded){return"Showfewerattempts";}consthidden=total-FIRST_ATTEMPTS_SHOWN;return`Show${hidden}more${hidden===1?"attempt":"attempts"}`;',
    );
  });

  it("names the kinds of import and the statuses, and gives each status a color", () => {
    expect(helper).toContain('case"ACTUALS":return"Actuals";');

    expect(helper).toContain('case"KPI_TARGETS":return"KPITargets";');

    expect(helper).toContain('case"VARIANCE_COMMENTARY":return"VarianceCommentary";');

    expect(helper).toContain('case"SUCCEEDED":return"Succeeded";');

    expect(helper).toContain('case"FAILED":return"text-destructive";');

    expect(helper).toContain('default:return"text-warning";');
  });

  it("has a word for a time that is not a time and for an account that is gone", () => {
    expect(helper).toContain(
      'returnNumber.isNaN(time.getTime())?"Unknowntime":time.toLocaleString();',
    );

    expect(helper).toContain('returncreatedBy??"Unavailable";');
  });

  it("gives the four counts with their names", () => {
    expect(helper).toContain(
      '[{label:"Rows",value:batch.rowCount},{label:"Inserted",value:batch.insertedCount},{label:"Updated",value:batch.updatedCount},{label:"Rejected",value:batch.rejectedCount},]',
    );
  });

  it("uses only plain ASCII characters", () => {
    expect(/^[\x00-\x7f]*$/.test(helperText)).toBe(true);

    expect(/^[\x00-\x7f]*$/.test(listText)).toBe(true);
  });
});

describe("the state of the history", () => {
  it("is a client component with attempts that start folded", () => {
    expect(listText.startsWith('"use client";\n')).toBe(true);

    expect(list).toContain("const[expanded,setExpanded]=useState(false);");

    expect(list).toContain('import{useEffect,useRef,useState}from"react";');
  });

  it("starts short again when the page brings a new history", () => {
    expect(list).toContain("const[seen,setSeen]=useState(history);");

    expect(list).toContain("if(seen!==history){setSeen(history);setExpanded(false);}");
  });

  it("takes the words of the button from the helper", () => {
    expect(list).toContain("consttoggle=describeAttemptToggle(history.length,expanded);");

    expect(list).toContain(
      'import{describeAttemptCounts,describeAttemptTime,describeAttemptToggle,describeAttemptUser,describeImportStatus,describeImportType,importStatusTone,isAttemptFolded,}from"@/lib/data-import/history-list";',
    );
  });

  it("brings the button back into view when the attempts are folded again", () => {
    expect(list).toContain(
      'useEffect(()=>{if(expanded===false&&foldedByButton.current){foldedByButton.current=false;buttonBox.current?.scrollIntoView({block:"end"});}},[expanded]);',
    );

    expect(list).toContain("constbuttonBox=useRef<HTMLDivElement>(null);");

    expect(list).toContain("constfoldedByButton=useRef(false);");
  });
});

describe("the blocks of the history", () => {
  it("are one list with one block for each attempt, on every screen", () => {
    expect(list).toContain('<uldata-slot="import-history-list">');

    expect(listText.split("history.map(").length - 1).toBe(1);

    expect(list).toContain('<likey={batch.id}data-slot="import-history-item"');
  });

  it("hide the folded attempts only below the wide screen", () => {
    expect(list).toContain(
      '{isAttemptFolded(index,history.length,expanded)?"@containerspace-y-2border-tpx-4py-3first:border-t-0max-xl:hidden":"@containerspace-y-2border-tpx-4py-3first:border-t-0"}',
    );

    expect(listText.split("max-xl:hidden").length - 1).toBe(1);
  });

  it("have the file name and the status on top, and the status is a word", () => {
    expect(list).toContain(
      '<pclassName="min-w-0break-wordstext-smfont-medium">{batch.fileName}</p>',
    );

    expect(list).toContain(
      "<pclassName={`shrink-0text-xsfont-semibold${importStatusTone(batch.status)}`}>{describeImportStatus(batch.status)}</p>",
    );
  });

  it("have a grid on a phone and one line that wraps when the block is 576px wide", () => {
    expect(list).toContain(
      '<dlclassName="gridgrid-cols-4gap-x-3gap-y-2text-xs@xl:flex@xl:flex-wrap@xl:gap-x-6">',
    );

    expect(listText.split('className="col-span-2 min-w-0"').length - 1).toBe(2);

    expect(listText.split('className="col-span-4 min-w-0"').length - 1).toBe(1);
  });

  it("name the kind, the time and the person, with the words from the helper", () => {
    expect(list).toContain('<dtclassName="text-muted-foreground">Type</dt>');

    expect(list).toContain('<dtclassName="text-muted-foreground">Time</dt>');

    expect(list).toContain('<dtclassName="text-muted-foreground">User</dt>');

    expect(list).toContain("{describeImportType(batch.importType)}");

    expect(list).toContain("{describeAttemptTime(batch.createdAt)}");

    expect(list).toContain("{describeAttemptUser(batch.createdBy)}");
  });

  it("show the four counts with a name above each one", () => {
    expect(list).toContain(
      '{describeAttemptCounts(batch).map((count)=>(<divkey={count.label}className="min-w-0"><dtclassName="break-wordstext-muted-foreground">{count.label}</dt><ddclassName="tabular-nums">{count.value}</dd></div>))}',
    );
  });

  it("show the error only when there is one, and let it break", () => {
    expect(list).toContain("{batch.errorSummary===null?null:(");

    expect(list).toContain(
      '<pclassName="break-wordsrounded-mdbg-muted/40px-2py-1.5text-xstext-muted-foreground">',
    );

    expect(list).toContain('<spanclassName="font-mediumtext-foreground">Error:</span>');

    expect(list).toContain("{batch.errorSummary}");
  });

  it("have a key for each attempt and each count", () => {
    expect(listText.split("key={batch.id}").length - 1).toBe(1);

    expect(listText.split("key={count.label}").length - 1).toBe(1);
  });
});

describe("the button under the blocks", () => {
  it("is shown only when there is a fold, and only below the wide screen", () => {
    expect(list).toContain("{toggle===null?null:(");

    expect(list).toContain(
      '<divref={buttonBox}data-slot="import-history-toggle"className="border-tp-3xl:hidden">',
    );
  });

  it("is a full-width button that does not send a form", () => {
    expect(list).toContain(
      '<Buttontype="button"variant="outline"size="lg"className="w-full"onClick={()=>{foldedByButton.current=expanded;setExpanded(expanded===false);}}>',
    );
  });

  it("has an arrow that points up when the attempts are open, and the words from the helper", () => {
    expect(list).toContain(
      '<ChevronDownaria-hidden="true"className={expanded?"rotate-180":undefined}/>{toggle}',
    );

    expect(list).toContain('import{ChevronDown}from"lucide-react";');

    expect(list).toContain('import{Button}from"@/components/ui/button";');
  });

  it("switches at the same width as the other lists", () => {
    expect(listText.split("xl:hidden").length - 1).toBe(2);

    expect(listText).not.toContain("md:hidden");
  });
});

describe("no table is left", () => {
  it("has no table and no box that scrolls sideways", () => {
    expect(listText).not.toContain("<table");

    expect(listText).not.toContain("ScrollRegion");

    expect(listText).not.toContain("overflow-x");

    expect(listText).not.toContain("min-w-[");
  });
});

describe("the import screen", () => {
  it("shows the history once, with the attempts that the page gives", () => {
    expect(workbenchText.split("<ImportHistoryList").length - 1).toBe(1);

    expect(workbench).toContain("<ImportHistoryListhistory={history}/>");

    expect(workbench).toContain(
      'import{ImportHistoryList,}from"@/components/data-import/import-history-list";',
    );
  });

  it("keeps the title, the sentence about 100 attempts and the empty message", () => {
    expect(workbench).toContain('<h2className="text-lgfont-semibold">Importhistory</h2>');

    expect(workbenchText).toContain(
      "The latest 100 governed import attempts are retained for this project.",
    );

    expect(workbench).toContain(
      '{history.length===0?(<divclassName="p-8text-smtext-muted-foreground">Nogovernedimportshavebeenrecordedyet.</div>):(<ImportHistoryListhistory={history}/>)}',
    );
  });

  it("no longer has its own table, its own words or its own box", () => {
    expect(workbenchText).not.toContain("min-w-[1200px]");

    expect(workbenchText).not.toContain("typeLabel(");

    expect(workbenchText).not.toContain("statusTone(");

    expect(workbenchText).not.toContain("toLocaleString");

    expect(workbenchText).not.toContain("ScrollRegion");
  });

  it("puts the history after the form that applies the import and before the integrity note", () => {
    expect(workbenchText.indexOf("Apply validated import")).toBeLessThan(
      workbenchText.indexOf("<ImportHistoryList"),
    );

    expect(workbenchText.indexOf("<ImportHistoryList")).toBeLessThan(
      workbenchText.indexOf("Import integrity"),
    );
  });
});

describe("the README", () => {
  const section = readmeSection("Import history you can read on a phone");

  it("explains the problem, the blocks, the fold, the wide screen and the limits", () => {
    for (const piece of [
      "The import history in the Data Import Center was a table with 10 columns, at least 1200px wide",
      "(1288px with a long file name or a long error)",
      "278px (a 320px phone), 318px (360px) or 348px (390px)",
      "78%, 75% and 73% of it was hidden",
      "only 2 of the 10 columns were in view",
      "At 768px it hid 44%",
      "it hid 63% (3 columns)",
      "the page is 1216px wide at most",
      "43% at 1280px, 36% at 1366px, 30% at 1440px, 23% at 1536px and 6% at 1920px",
      "8799px of page on a phone",
      "**Blocks on every screen:**",
      "`components/data-import/import-history-list.tsx` shows each attempt as a block",
      "so there is no table now, and nothing scrolls sideways at any width",
      '("Succeeded", "Failed", "Processing")',
      "**Layout by the width of the block:**",
      "(a container query)",
      "When the block is 576px wide or more",
      "164px to 221px tall on a phone",
      "249px to 281px",
      "**First 3 attempts, then a button:**",
      '"Show 97 more attempts"',
      '"Show fewer attempts"',
      "866px, 798px or 782px tall on a 320px, 360px or 390px phone",
      "(it was 1199px with 12 attempts, and 8799px with 100)",
      "466px at 768px and 706px at 1024px",
      "A history of 5 attempts or fewer is shown whole",
      "`FIRST_ATTEMPTS_SHOWN` and `FEWEST_ATTEMPTS_HIDDEN`",
      "**Like the other lists:**",
      "44px tall on a touch screen",
      "the page is scrolled back to the button when the attempts are folded",
      "starts folded again when the page brings a new list",
      "**From 1280px:**",
      "every attempt is shown and the button is gone (`display: none`)",
      "12 attempts take 1270px at 1280px and 1222px from 1366px (the table took 1179px)",
      "100 attempts take 9634px and 9314px (the table took 8779px)",
      "**The words and the colors:**",
      "`describeImportType`, `describeImportStatus` and `importStatusTone`",
      "The fold is not remembered after a reload",
      "The time uses the language and the time zone of the browser, as before",
      "320px, 360px, 390px, 768px, 1024px, 1280px, 1366px, 1440px, 1536px and 1920px",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its two test files", () => {
    for (const name of [
      "tests/data-import/history-list.test.ts",
      "tests/data-import/history-list-source.test.ts",
    ]) {
      expect(section, name).toContain(`\`${name}\``);
    }
  });

  it("comes after the section about the preview and before the download section", () => {
    const before = readme.indexOf("## Preview rows you can read on a phone");

    const here = readme.indexOf("## Import history you can read on a phone");

    const download = readme.indexOf("## Download your data");

    expect(before).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(before);

    expect(download).toBeGreaterThan(here);
  });
});
