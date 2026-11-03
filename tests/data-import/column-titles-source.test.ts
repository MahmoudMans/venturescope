import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const headers = read("lib/data-import/headers.ts");

const validation = read("lib/data-import/validation.ts");

const types = read("lib/data-import/types.ts");

const actualsCsv = read("lib/finance/actuals/csv.ts");

const workbench = read("components/data-import/data-import-workbench.tsx");

const workspace = read("components/actuals/actuals-variance-workspace.tsx");

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

describe("the list and the reader of the titles", () => {
  it("makes a title lower case and removes accents and marks", () => {
    expect(squash(headers)).toContain(
      '.normalize("NFD").replace(/\\p{M}/gu,"").toLowerCase().replace(/[^a-z0-9]/g,"");',
    );
  });

  it("has a list for each of the three kinds of file", () => {
    expect(headers).toContain(
      "export const COLUMN_TITLES: Record<DataImportType, ColumnTitles> = {",
    );

    for (const type of ["ACTUALS", "KPI_TARGETS", "VARIANCE_COMMENTARY"]) {
      expect(headers, type).toContain(`  ${type}: {`);
    }
  });

  it("puts the title of the template first and then the order of the list", () => {
    expect(squash(headers)).toContain(
      "constrank=(index:number)=>normalized[index]===own?-1:known.indexOf(normalized[index]);",
    );

    expect(squash(headers)).toContain("if(winners.length>1){thrownewError(");
  });

  it("uses only plain ASCII characters", () => {
    expect(/^[\x00-\x7f]*$/.test(headers)).toBe(true);
  });
});

describe("the Data Import Center", () => {
  it("renames the columns of the file before it checks anything", () => {
    const flat = squash(validation);

    expect(flat).toContain("consttitles=readColumnTitles(importType,file.headers,);");

    expect(flat).toContain("constheaders=titles.fields;");

    expect(flat).toContain("constdelimiter=file.delimiter;");

    expect(flat).toContain('[headers[index],record[title]??"",]');

    expect(flat.indexOf("readColumnTitles(importType")).toBeLessThan(flat.indexOf("constmissing="));
  });

  it("tells the other titles when a title is missing, and when there are no numbers", () => {
    const flat = squash(validation);

    expect(flat).toContain("thrownewError(describeMissingTitles(importType,missing,),);");

    expect(flat).toContain("constnoNumbers=describeNoNumbers(importType,headers,);");

    expect(flat).toContain("if(noNumbers!==null){thrownewError(noNumbers,);}");

    expect(flat.indexOf("describeMissingTitles(importType")).toBeLessThan(
      flat.indexOf("constnoNumbers="),
    );
  });

  it("gives back how the titles were read", () => {
    expect(squash(validation)).toContain(
      "renamedColumns:titles.renamed,ignoredColumns:titles.ignored,",
    );

    expect(squash(types)).toContain("renamedColumns:{title:string;field:string;}[];");

    expect(squash(types)).toContain("ignoredColumns:string[];");
  });
});

describe("the import screen", () => {
  it("shows a note about the titles, after the note about the format and before the preview", () => {
    expect(workbench.split("<ImportColumnsNote").length - 1).toBe(1);

    expect(workbench).toContain("function ImportColumnsNote({");

    expect(squash(workbench)).toContain("describeColumns(renamed,ignored,)");

    expect(squash(workbench).split("if(note===null){returnnull;}").length - 1).toBe(4);

    expect(workbench).toContain('data-slot="import-columns-note"');

    expect(squash(workbench)).toContain(
      "<ImportColumnsNoterenamed={validation.result.renamedColumns}ignored={validation.result.ignoredColumns}/>",
    );

    const format = workbench.indexOf("<ImportFormatNote");

    const columns = workbench.indexOf("<ImportColumnsNote");

    const preview = workbench.indexOf("First eight rows only.");

    expect(columns).toBeGreaterThan(format);

    expect(preview).toBeGreaterThan(columns);
  });

  it("gives the note the same look as the note about the format", () => {
    const look = 'className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"';

    expect(workbench.split(look).length - 1).toBe(4);
  });
});

describe("the Actuals page", () => {
  it("reads the titles with the shared list and the shared reader of a title", () => {
    const flat = squash(actualsCsv);

    expect(flat).toContain("constHEADER_ALIASES=COLUMN_TITLES.ACTUALS;");

    expect(flat).toContain('from"@/lib/data-import/headers"');

    expect(flat.split("normalizeTitle").length - 1).toBe(2);

    expect(actualsCsv).not.toContain("normalizeHeader");
  });

  it("tells in the hint that the titles can be English or French", () => {
    expect(workspace).toContain(
      "Column titles can be English or French, like Month or Mois, Revenue or CA.",
    );
  });

  it("tells the same on the import screen, with the capital letters and the spaces", () => {
    expect(workbench).toContain(
      "Column titles can be English or French, like Month or Mois, Revenue or CA. Capital letters and spaces do not matter.",
    );
  });
});

describe("the README", () => {
  const section = readmeSection("Column titles as people write them");

  it("explains the problem, the fixes, the rules and the limits", () => {
    for (const piece of [
      'refused with "Missing required CSV headers: period."',
      "a capital R",
      "dropped in silence",
      "`COLUMN_TITLES`",
      "`lib/data-import/headers.ts`",
      "The Actuals page uses the same list",
      "`normalizeTitle()`",
      "`Operating Expenses`, `operating_expenses` and `operatingExpenses` are the same title",
      "the title of the template wins, then the first title of the list",
      "(Month, then Period, then Date)",
      "are refused, because nothing says which one is meant",
      "Your column titles were read like this: Mois = period",
      "A title that differs only in capital letters is not listed",
      "These columns are not used: Notes",
      "keeps its first sentence and adds the other titles that are read",
      "No column with numbers was found.",
      "the values are not translated",
      "EBITDA_MARGIN, VOLUME, RECURRING, MONITORING",
      "Arabic titles and the titles of other languages are not read",
      "A file with the titles of the template is read as before",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its four test files", () => {
    for (const name of [
      "tests/data-import/headers.test.ts",
      "tests/data-import/column-titles-import.test.ts",
      "tests/actuals/column-titles-csv.test.ts",
      "tests/data-import/column-titles-source.test.ts",
    ]) {
      expect(section, name).toContain(`\`${name}\``);
    }
  });

  it("comes after the section about months and before the download section", () => {
    const months = readme.indexOf("## Months as Excel writes them");

    const here = readme.indexOf("## Column titles as people write them");

    const download = readme.indexOf("## Download your data");

    expect(months).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(months);

    expect(download).toBeGreaterThan(here);
  });
});
