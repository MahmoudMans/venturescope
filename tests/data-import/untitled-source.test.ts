import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const table = squash(read("lib/data-import/table.ts"));

const tableText = read("lib/data-import/table.ts");

const validation = squash(read("lib/data-import/validation.ts"));

const actualsCsv = squash(read("lib/finance/actuals/csv.ts"));

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

describe("counting the values that have no title", () => {
  it("counts a value that has text, in a column whose title is missing or empty", () => {
    expect(table).toContain("exportfunctioncountUntitled(titles:string[],cells:string[]):number{");

    expect(table).toContain('if(cell.trim()!==""&&(titles[column]??"").trim()===""){total+=1;}');
  });

  it("counts them for each record of a table", () => {
    expect(table).toContain("untitled:body.map((row)=>countUntitled(titleCells,row.cells)),");

    expect(table).toContain("untitled:number[];");
  });

  it("keeps the table as it was: the records only have the titles that are kept", () => {
    expect(table).toContain(
      'constrecords=body.map((row)=>Object.fromEntries(headers.map((header,place)=>[header,row.cells[kept[place]]??""])),);',
    );
  });

  it("uses only plain ASCII characters", () => {
    expect(/^[\x00-\x7f]*$/.test(tableText)).toBe(true);
  });

  it("writes the sentence for one value and for more values", () => {
    expect(table).toContain('constvalues=one?"1valueinacolumn":`${count}valuesincolumns`;');

    expect(table).toContain('"Addatitleforit,ordeleteit."');

    expect(table).toContain('"Addtitlesforthem,ordeletethem."');

    expect(table).toContain("toatext,putthewholetextinquotes.");
  });
});

describe("the Data Import Center", () => {
  it("makes an issue for each row that has such a value", () => {
    expect(validation).toContain("constuntitled=file.untitled[index];");

    expect(validation).toContain(
      'if(untitled>0){issues.push({row:rowNumber,field:"notitle",message:describeUntitled(untitled,),});}',
    );
  });

  it("does not import a row that has such a value", () => {
    expect(validation).toContain("if(row&&problems.length===0&&untitled===0){rows.push(row,);}");
  });

  it("gets the sentence from the table reader", () => {
    expect(validation).toContain(
      'import{describeUntitled,readCsvTable,titleRules,}from"@/lib/data-import/table";',
    );
  });
});

describe("the Actuals page", () => {
  it("imports the two helpers from the table reader", () => {
    expect(actualsCsv).toContain(
      'import{countUntitled,describeUntitled,dropSepLine,findTable,titleRules,}from"@/lib/data-import/table";',
    );
  });

  it("works out the row of the sheet once", () => {
    expect(actualsCsv).toContain("constsheetRow=headerIndex+rowIndex+2;");

    expect(actualsCsv).toContain("(row${sheetRow}).Ifitisatotalrow,removeit.");
  });

  it("refuses a row that has values and no month, and still skips an empty row", () => {
    expect(actualsCsv).toContain(
      'if(dataRows[rowIndex].some((cell,)=>cell.trim()!=="",)){thrownewError(`Row${sheetRow}:Thisrowhasvaluesbutnomonth.Addthemonth,ordeletetherow.`,);}continue;}',
    );
  });

  it("refuses a value that has no title, after the month was read", () => {
    expect(actualsCsv).toContain(
      "constuntitled=countUntitled(table[headerIndex],dataRows[rowIndex],);if(untitled>0){thrownewError(`Row${sheetRow}:${describeUntitled(untitled,)}`,);}",
    );

    const month = actualsCsv.indexOf("parseActualMonth(rawPeriod,)");

    const untitled = actualsCsv.indexOf("constuntitled=countUntitled(");

    expect(month).toBeGreaterThan(-1);

    expect(untitled).toBeGreaterThan(month);
  });
});

describe("the README", () => {
  const section = readmeSection("Values that had no place");

  it("explains the problem, the fixes, the rules and the limits", () => {
    for (const piece of [
      "A row with more values than the file has column titles",
      "lost the extra values on both screens",
      "On the Actuals page a row that had numbers but no month was skipped",
      "`lib/data-import/table.ts` counts these values for each row (`countUntitled`)",
      "Empty cells at the end of a row are not values",
      "the field `no title`",
      "with its row as the sheet counts it",
      "The row is not imported, and the other rows are read as before",
      '"CSV contains an empty header."',
      "A value under an empty title is now refused here too",
      "Row 3: This row has values but no month. Add the month, or delete the row.",
      "A row with nothing in it, an empty line and a line of marks only are still skipped",
      "A total row without a name was skipped before and is refused now",
      "a text with a comma in it must be in quotes",
      "the Actuals page stops at the first row with a problem",
      "the first 50 are shown",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its two test files", () => {
    for (const name of [
      "tests/data-import/untitled.test.ts",
      "tests/data-import/untitled-source.test.ts",
    ]) {
      expect(section, name).toContain(`\`${name}\``);
    }
  });

  it("comes after the section about files that do not start at the table", () => {
    const before = readme.indexOf("## Files that do not start at the table");

    const here = readme.indexOf("## Values that had no place");

    const download = readme.indexOf("## Download your data");

    expect(before).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(before);

    expect(download).toBeGreaterThan(here);
  });

  it("no longer says that extra cells are lost", () => {
    expect(readme).not.toContain("loses the extra cells");

    expect(squash(readmeSection("Files that do not start at the table"))).toContain(
      squash('A row with more cells than titles is refused (see "Values that had no place").'),
    );
  });
});
