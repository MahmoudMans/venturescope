import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const table = read("lib/data-import/table.ts");

const csv = read("lib/data-import/csv.ts");

const delimiter = read("lib/data-import/delimiter.ts");

const number = read("lib/data-import/number.ts");

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

describe("the table finder", () => {
  it("uses only plain ASCII characters", () => {
    for (const text of [table, number, delimiter]) {
      expect(/^[\x00-\x7f]*$/.test(text)).toBe(true);
    }
  });

  it("looks at the first 200 rows and tries each mark in turn", () => {
    expect(table).toContain("export const MOST_ROWS_SEARCHED = 200;");

    expect(squash(table)).toContain("constcandidates=delimiterCandidates(input);");

    expect(squash(table)).toContain("for(constdelimiterofcandidates){");

    expect(squash(table)).toContain("Math.min(rows.length,MOST_ROWS_SEARCHED)");
  });

  it("stops at the first row that holds all the titles", () => {
    expect(squash(table)).toContain(
      "if(score>=rules.full){return{delimiter,rows,index,complete:true};}",
    );
  });

  it("keeps the row with the most titles when no row is complete", () => {
    expect(squash(table)).toContain(
      "if(score>bestScore){bestScore=score;best={delimiter,rows,index,complete:false};}",
    );
  });

  it("uses the first row when nothing looks like titles, so the old messages stay", () => {
    expect(squash(table)).toContain("conststart=Math.max(found.index,0);");
  });

  it("does not take a row with two columns for one field out of the search", () => {
    expect(squash(table)).toContain("}catch{returnfull;}");
  });

  it("takes the sep= line away and moves the numbers of the rows up by one", () => {
    expect(squash(table)).toContain("rows.slice(1).map((row)=>({row:row.row-1,cells:row.cells}))");

    expect(squash(table)).toContain("readDeclaredDelimiter(input)===null?rows:rows.slice(1)");
  });

  it("refuses an empty header and two equal headers with the old messages", () => {
    expect(table).toContain('throw new Error("CSV contains an empty header.");');

    expect(table).toContain('throw new Error("CSV contains duplicate headers.");');

    expect(table).toContain('throw new Error("CSV is empty.");');
  });

  it("leaves out only a column that has no title and no value", () => {
    expect(squash(table)).toContain(
      'constempty=title.trim()===""&&body.every((row)=>(row.cells[column]??"").trim()==="");',
    );
  });
});

describe("the reader of the rows", () => {
  it("numbers each row and counts the rows without cells", () => {
    expect(squash(csv)).toContain("exporttypeCsvRow={row:number;cells:string[];};");

    expect(squash(csv)).toContain("letrowNumber=1;");

    expect(squash(csv)).toContain("rowNumber+=1;");

    expect(squash(csv)).toContain("rows.push({row:rowNumber,cells:currentRow,});");
  });

  it("keeps the matrix of before for the other readers", () => {
    expect(squash(csv)).toContain(
      "returnparseCsvRows(input,delimiter,).map((item,)=>item.cells,);",
    );

    expect(squash(csv)).toContain("exportfunctionparseCsvMatrix(");
  });

  it("keeps csvRecords as it was", () => {
    expect(squash(csv)).toContain("exportfunctioncsvRecords(");

    expect(csv).toContain('"CSV contains an empty header."');
  });

  it("reads the sep= line only at the start of the file", () => {
    expect(squash(delimiter)).toContain(String.raw`/^sep=([,;\t])[\t]*(?:\r\n|\r|\n|$)/i`);

    expect(delimiter).toContain("input.charCodeAt(0) === 0xfeff");
  });

  it("puts the declared mark first and the counted mark second", () => {
    expect(squash(delimiter)).toContain(
      'constorder:(CsvDelimiter|null)[]=[readDeclaredDelimiter(input),detectCsvDelimiter(input),",",";","\\t",];',
    );
  });
});

describe("a dash or n/a", () => {
  it("is one check that the Data Import Center and the Actuals page share", () => {
    expect(number).toContain("export function isNoNumber(text: string): boolean {");

    expect(squash(actualsCsv)).toContain("isNoNumber(trimmed,)");

    expect(squash(actualsCsv)).toContain(
      'import{isNoNumber,readImportNumber,}from"@/lib/data-import/number";',
    );
  });

  it("is read as empty only in an Actuals file", () => {
    expect(squash(number)).toContain(
      'if(importType==="ACTUALS"&&isNoNumber(raw)){next[field]="";emptied+=1;continue;}',
    );
  });

  it("is made of dashes, with the escapes written as numbers", () => {
    expect(squash(number)).toContain("[0x2d,0x2011,0x2012,0x2013,0x2014,0x2212]");

    expect(squash(number)).toContain("^[${DASHES}]{1,3}$");
  });

  it("is counted, and the count goes in the result", () => {
    expect(squash(validation)).toContain("emptyNumbers+=emptied;");

    expect(squash(validation)).toContain(
      "layout:{titleRow:file.titleRow,emptyColumns:file.emptyColumns,emptyNumbers,},",
    );

    expect(squash(types)).toContain("layout:TableLayout;");
  });
});

describe("the Data Import Center", () => {
  it("reads the file as a table with the titles of its kind of file", () => {
    const flat = squash(validation);

    expect(flat).toContain(
      "constfile=readCsvTable(csv,titleRules(importType,REQUIRED_HEADERS[importType],),);",
    );

    expect(flat).not.toContain("csvRecords");
  });

  it("names the row of each issue with the row of the file", () => {
    const flat = squash(validation);

    expect(flat).toContain("constrowNumber=file.rowNumbers[index];");

    expect(flat).toContain("row:file.rowNumbers[months.problem.index],");

    expect(flat).not.toContain("index+2");
  });
});

describe("the Actuals page", () => {
  it("finds the mark and the titles with the same finder", () => {
    const flat = squash(actualsCsv);

    expect(flat).toContain(
      'import{countUntitled,describeUntitled,dropSepLine,findTable,titleRules,}from"@/lib/data-import/table";',
    );

    expect(flat).toContain('constTITLE_RULES=titleRules("ACTUALS",["period",],);');

    expect(flat).toContain(
      "constfound=findTable(csv,(candidate,)=>dropSepLine(csv,parseCsvTable(csv,candidate,),),TITLE_RULES,);",
    );

    expect(flat).toContain("constheaderIndex=found.complete?found.index:-1;");

    expect(actualsCsv).not.toContain("detectCsvDelimiter");
  });

  it("names the row of a month that is not a month", () => {
    const flat = squash(actualsCsv);

    expect(flat).toContain("(row${sheetRow}).Ifitisatotalrow,removeit.");
  });

  it("tells in the hint that lines above the titles are skipped", () => {
    expect(workspace).toContain(
      "Lines above the column titles are skipped, and a dash or n/a means no number.",
    );
  });
});

describe("the import screen", () => {
  it("shows a note about the layout, after the note about the format and before the titles", () => {
    expect(workbench.split("<ImportLayoutNote").length - 1).toBe(1);

    expect(workbench).toContain("function ImportLayoutNote({");

    expect(squash(workbench)).toContain("describeLayout(layout,)");

    expect(workbench).toContain('data-slot="import-layout-note"');

    expect(squash(workbench)).toContain("<ImportLayoutNotelayout={validation.result.layout}/>");

    const format = workbench.indexOf("<ImportFormatNote");

    const layout = workbench.indexOf("<ImportLayoutNote");

    const columns = workbench.indexOf("<ImportColumnsNote");

    expect(layout).toBeGreaterThan(format);

    expect(columns).toBeGreaterThan(layout);
  });

  it("tells in the hint about the lines above the titles and about the dash", () => {
    expect(workbench).toContain(
      "Lines above the column titles and empty columns are fine too. In an Actuals file, a dash or n/a means no number.",
    );
  });
});

describe("the README", () => {
  const section = readmeSection("Files that do not start at the table");

  it("explains the problem, the fixes, the rules and the limits", () => {
    for (const piece of [
      "a report name above the table, a `sep=;` line, or a title line above a semicolon file failed on both screens",
      '"CSV contains an empty header."',
      '"cogs must be a valid number."',
      "`lib/data-import/table.ts` looks for the first row that has the column titles the file needs (the first 200 rows)",
      "the row with the most titles is taken",
      "the first row is used, as before, so the old messages stay",
      "the mark that a `sep=;` line declares is tried first",
      "it is not a row",
      "a column with no title and no value in any row is left out",
      "A column with values and no title is still refused",
      "a lone dash (hyphen, en dash, em dash, minus sign), `n/a`",
      "It is not a zero",
      "A KPI target must be a number, so a dash is still refused there",
      "An empty row has a number too",
      "Invalid actuals month: Total (row 5). If it is a total row, remove it.",
      "The column titles are on row 3. The 2 rows above them were not used.",
      "Nothing is shown for a file that starts with its titles",
      "a table that starts after row 200 is not found",
      "Two tables in one file are not read",
      "the Actuals page still reads at most 120 months",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its three test files", () => {
    for (const name of [
      "tests/data-import/table.test.ts",
      "tests/data-import/table-import.test.ts",
      "tests/data-import/table-source.test.ts",
    ]) {
      expect(section, name).toContain(`\`${name}\``);
    }
  });

  it("comes after the section about values and before the download section", () => {
    const values = readme.indexOf("## Values as people write them");

    const here = readme.indexOf("## Files that do not start at the table");

    const download = readme.indexOf("## Download your data");

    expect(values).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(values);

    expect(download).toBeGreaterThan(here);
  });
});
