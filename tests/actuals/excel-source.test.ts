import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const month = read("lib/finance/actuals/month.ts");

const monthColumn = read("lib/finance/actuals/month-column.ts");

const actualsCsv = read("lib/finance/actuals/csv.ts");

const tableCsv = read("lib/finance/analytics/csv.ts");

const validation = read("lib/data-import/validation.ts");

const action = read("app/(app)/projects/[projectId]/actuals/actions.ts");

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

describe("the month reader", () => {
  it("removes accents before it reads a name", () => {
    expect(squash(month)).toContain('.normalize("NFD",).replace(/[\\u0300-\\u036f]/g,"",);');
  });

  it("reads a year with two digits as 20 and those digits", () => {
    expect(squash(month)).toContain("returntext.length===2?2000+Number(text,):Number(text,);");

    expect(squash(month)).toContain("(\\d{2}|\\d{4})$/u.exec(trimmed,)");
  });

  it("knows the French names that Excel writes", () => {
    for (const name of [
      "janvier",
      "janv",
      "fevrier",
      "fevr",
      "fev",
      "mars",
      "avril",
      "avr",
      "mai",
      "juin",
      "juillet",
      "juil",
      "aout",
      "septembre",
      "octobre",
      "novembre",
      "decembre",
    ]) {
      expect(squash(month), name).toContain(`${name}:`);
    }
  });

  it("uses only plain ASCII characters in the new files", () => {
    for (const text of [month, monthColumn]) {
      expect(/^[\x00-\x7f]*$/.test(text)).toBe(true);
    }
  });
});

describe("the reader of a month column", () => {
  it("asks for one sure order and not for a guess", () => {
    expect(monthColumn).toContain("const FULL_DATE =");

    expect(monthColumn).toContain("if (dayFirstSigns.length > 0 && monthFirstSigns.length > 0) {");

    expect(monthColumn).toContain("if (dayFirst === null && options.unique) {");

    expect(monthColumn).toContain("if (dayFirst === null && options.dayFirstDefault) {");

    expect(monthColumn).toContain("if (dayFirst === null) {");
  });
});

describe("the Actuals reader", () => {
  it("finds the mark of the file and splits the table with it", () => {
    expect(squash(actualsCsv)).toContain("constdelimiter=found.delimiter;");

    expect(squash(actualsCsv)).toContain('constdecimalComma=delimiter===";";');

    expect(squash(actualsCsv)).toContain("parseCsvTable(csv,candidate,)");

    expect(squash(tableCsv)).toContain('delimiter:string=",",');

    expect(squash(tableCsv)).toContain("character===delimiter");
  });

  it("reads the month column once, with one row per month", () => {
    const flat = squash(actualsCsv);

    expect(flat).toContain('readMonthColumn(dataRows.map((row,)=>row[periodColumn]??"",),');

    expect(flat).toContain("unique:true,dayFirstDefault:decimalComma,");

    expect(flat).toContain("if(months.problem){thrownewError(months.problem.message,);}");

    expect(flat).toContain("constrawPeriod=months.cells[rowIndex]?.trim();");
  });

  it("reads the number cells of each row that has a month, with the decimal comma switch", () => {
    const flat = squash(actualsCsv);

    expect(flat).toContain("constnumberColumns=Object.values(columns,);");

    expect(flat).toContain(
      "constrow=readNumberCells(dataRows[rowIndex],numberColumns,decimalComma,);",
    );

    expect(flat).toContain("readImportNumber(cell.trim(),decimalComma,)");

    expect(flat).toContain("if(read.ok===false){thrownewError(read.message,);}");

    expect(flat).toContain("cells[column]=read.text;");

    expect(flat.indexOf("constrow=readNumberCells(")).toBeGreaterThan(
      flat.indexOf("constperiod=parseActualMonth("),
    );
  });

  it("never removes a comma in a file with semicolons", () => {
    expect(squash(actualsCsv)).toContain(
      'if(decimalComma&&read.text.includes(",",)){thrownewError(`Invalidfinancialnumber:${cell}`,);}',
    );
  });
});

describe("the Data Import Center", () => {
  it("reads the month column of its file, and the months of the three kinds of file", () => {
    const flat = squash(validation);

    expect(flat).toContain('constmonthField=importType==="ACTUALS"?"period":"periodKey";');

    expect(flat).toContain(
      'readMonthColumn(records.map((fileRecord,)=>fileRecord[monthField]??"",),',
    );

    expect(flat).toContain('unique:importType==="ACTUALS",dayFirstDefault:delimiter===";",');
  });

  it("tells a problem of the dates on the row of the cell, before the other issues", () => {
    const flat = squash(validation);

    expect(flat).toContain(
      "if(months.problem){issues.push({row:file.rowNumbers[months.problem.index],field:monthField,message:months.problem.message,});}",
    );

    expect(flat.indexOf("file.rowNumbers[months.problem.index]")).toBeLessThan(
      flat.indexOf("records.forEach("),
    );
  });

  it("checks the month that was read and shows the text of the file in the preview", () => {
    const flat = squash(validation);

    expect(flat).toContain("{...fileRecord,[monthField]:months.cells[index],}");

    expect(flat).toContain("preview:records.slice(0,8,)");
  });
});

describe("the Actuals page", () => {
  it("reads the bytes of the file with the reader of Excel files", () => {
    expect(squash(action)).toContain(
      "parseActualsCsv(decodeCsvBytes(newUint8Array(awaituploaded.arrayBuffer(),),),)",
    );

    expect(action).not.toContain("uploaded.text()");

    expect(action).toContain('from "@/lib/data-import/decode"');
  });

  it("lets a person pick .tsv and .txt files, and describes the file picker", () => {
    expect(workspace).toContain(
      'accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"',
    );

    expect(workspace).toContain('aria-describedby="actuals-file-hint"');

    expect(workspace).toContain('id="actuals-file-hint"');

    expect(workspace).toContain(
      "A file saved by Excel is read too: with commas, semicolons or tabs, a decimal comma (1250,50), and months like Jan-27, janv.-27 or 01/01/2027.",
    );
  });

  it("puts the hint under the form", () => {
    const form = workspace.indexOf("</form>");

    const hint = workspace.indexOf('id="actuals-file-hint"');

    expect(form).toBeGreaterThan(-1);

    expect(hint).toBeGreaterThan(form);
  });
});

describe("the README", () => {
  const section = readmeSection("Months as Excel writes them");

  it("explains the problem, the fixes, the rules and the limits", () => {
    for (const piece of [
      'refused every such file with "period must be a valid month."',
      'a quoted "1250,50" became 125050',
      "`parseMonthKey()`",
      "`lib/finance/actuals/month.ts`",
      'reads "Jan-27", "Jan 2027", "janv.-27", "1 janvier 2027" and "27-Jan-27"',
      "A year with two digits means 20 and those digits",
      "English and French month names are known, with or without accents",
      "`readMonthColumn()`",
      "`lib/finance/actuals/month-column.ts`",
      "a number above 12 can only be a day",
      "takes the order in which no month repeats",
      "a file with semicolons takes the day first",
      "Anything else is not guessed",
      "Write 2027-04 if it is 3 April, or 2027-03 if it is 4 March.",
      "A column with both orders is refused",
      "`parseActualsCsv()`",
      "`lib/finance/actuals/csv.ts`",
      'a quoted "1250,50" is now 1250.50 and not 125050',
      "the column titles must be the English ones of the template",
      "Arabic month names, Arabic digits",
      "A date with a year of two digits (31/01/27) is not read",
      "A normal file is read as before",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its four test files", () => {
    for (const name of [
      "tests/actuals/excel-months.test.ts",
      "tests/actuals/excel-csv.test.ts",
      "tests/data-import/excel-months-import.test.ts",
      "tests/actuals/excel-source.test.ts",
    ]) {
      expect(section, name).toContain(`\`${name}\``);
    }
  });

  it("comes after the section about Excel files and before the download section", () => {
    const before = readme.indexOf("## Import files saved by Excel in other languages");

    const here = readme.indexOf("## Months as Excel writes them");

    const download = readme.indexOf("## Download your data");

    expect(before).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(before);

    expect(download).toBeGreaterThan(here);
  });
});
