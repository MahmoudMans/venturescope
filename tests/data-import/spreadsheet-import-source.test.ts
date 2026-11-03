import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { NUMBER_FIELDS } from "@/lib/data-import/number";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const csv = read("lib/data-import/csv.ts");

const validation = read("lib/data-import/validation.ts");

const numberLib = read("lib/data-import/number.ts");

const delimiterLib = read("lib/data-import/delimiter.ts");

const decodeLib = read("lib/data-import/decode.ts");

const paste = read("lib/forms/paste-number.ts");

const types = read("lib/data-import/types.ts");

const workbench = read("components/data-import/data-import-workbench.tsx");

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

describe("the reader of the cells", () => {
  it("splits the cells at the mark that was found, and not always at a comma", () => {
    expect(squash(csv)).toContain("character===delimiter");

    expect(squash(csv)).not.toContain('character===","');

    expect(squash(csv)).toContain("delimiter:CsvDelimiter=detectCsvDelimiter(input,)");
  });

  it("finds the mark once for a file and gives it back with the rows", () => {
    expect(squash(csv)).toContain("constdelimiter=detectCsvDelimiter(input,);");

    expect(squash(csv)).toContain("parseCsvMatrix(input,delimiter,)");

    expect(squash(csv)).toContain("headers,records,delimiter,};");
  });

  it("lets the comma win when two marks are used the same number of times", () => {
    expect(delimiterLib).toContain('let best: CsvDelimiter = ",";');

    expect(delimiterLib).toContain('for (const candidate of [";", "\\t"] as const) {');

    expect(delimiterLib).toContain("if (counts[candidate] > counts[best]) {");
  });

  it("does not count a mark inside quotes, and stops at the end of the first line", () => {
    expect(delimiterLib).toContain("quoted = quoted === false;");

    expect(delimiterLib).toContain("if (quoted) {");

    expect(delimiterLib).toContain("if (started) {");

    expect(delimiterLib).toContain("break;");
  });
});

describe("the number columns", () => {
  it("are read for each row, with a decimal comma only for a file with semicolons", () => {
    expect(squash(validation)).toContain(
      squash(
        'readRecordNumbers( importType, { ...fileRecord, [monthField]: months.cells[index], }, delimiter === ";", )',
      ),
    );
  });

  it("give an issue for a number that is not clear, and the row is not used", () => {
    expect(squash(validation)).toContain(
      squash(
        "for ( const problem of problems ) { issues.push({ row: rowNumber, field: problem.field, message: problem.message, }); }",
      ),
    );

    expect(squash(validation)).toContain(squash("row && problems.length === 0"));
  });

  it("are the same columns that the row checks read", () => {
    const flat = squash(validation);

    for (const field of NUMBER_FIELDS.ACTUALS.filter((name) => name !== "customers")) {
      expect(flat, field).toContain(`readNumber("${field}",)`);
    }

    expect(flat).toContain("customersOrNull(record.customers");

    expect(flat).toContain("record.targetValue");

    const used = [...validation.matchAll(/readNumber\(\s*"(\w+)"/g)].map((match) => match[1]);

    expect(used.length).toBeGreaterThan(0);

    for (const field of used) {
      expect(NUMBER_FIELDS.ACTUALS, field).toContain(field);
    }

    expect(NUMBER_FIELDS.KPI_TARGETS).toEqual(["targetValue"]);
  });

  it("use the reader of pasted numbers, with the decimal comma switch", () => {
    expect(numberLib).toContain('import { parsePastedNumber } from "@/lib/forms/paste-number";');

    expect(numberLib).toContain("parsePastedNumber(text, decimalComma) ?? raw");

    expect(paste).toContain(
      "export function parsePastedNumber(raw: string, decimalComma = false): string | null {",
    );

    expect(paste).toContain(
      "decimalComma === false && /^\\d{1,3}(,\\d{3})+(\\.\\d+)?$/.test(text)",
    );
  });

  it("do not guess a dot with exactly three digits after it in a file with semicolons", () => {
    expect(numberLib).toContain("const UNCLEAR_DOT = /^[-+]?\\d{1,3}\\.\\d{3}$/;");

    expect(numberLib).toContain("if (decimalComma && UNCLEAR_DOT.test(text)) {");
  });

  it("are given back in the result, so the screen can say how the file was read", () => {
    expect(squash(validation)).toContain(
      "headers,delimiter,renamedColumns:titles.renamed,ignoredColumns:titles.ignored,readValues:Array.from(readValues.values(),),layout:{titleRow:file.titleRow,emptyColumns:file.emptyColumns,emptyNumbers,},rowCount:",
    );

    expect(squash(types)).toContain("delimiter:CsvDelimiter;");
  });
});

describe("the reader of the bytes", () => {
  it("reads valid UTF-8 first, then UTF-16 with a byte order mark, then Windows-1252", () => {
    expect(decodeLib).toContain('new TextDecoder("utf-8", { fatal: true }).decode(bytes)');

    expect(decodeLib).toContain('new TextDecoder("windows-1252").decode(bytes)');

    expect(decodeLib).toContain('new TextDecoder("utf-16le").decode(bytes)');

    expect(decodeLib).toContain('new TextDecoder("utf-16be").decode(bytes)');
  });

  it("uses only plain ASCII characters in the new files", () => {
    for (const text of [delimiterLib, decodeLib, numberLib]) {
      expect(/^[\x00-\x7f]*$/.test(text)).toBe(true);
    }

    expect(delimiterLib).toContain("\\uFEFF");
  });
});

describe("the screen", () => {
  it("reads the bytes of the file with the new reader, and not as UTF-8 only", () => {
    expect(workbench).toContain("decodeCsvBytes(");

    expect(workbench).toContain("await file.arrayBuffer()");

    expect(workbench).not.toContain("file.text()");
  });

  it("lets a person pick .tsv and .txt files, and describes the file picker", () => {
    expect(workbench).toContain(
      'accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"',
    );

    expect(workbench).toContain('aria-describedby="import-file-hint"');

    expect(workbench).toContain('id="import-file-hint"');

    expect(workbench).toContain(
      "A file saved by Excel is read too: with commas, semicolons or tabs, a decimal comma (1250,50), and accents.",
    );
  });

  it("shows a note about the format once, between the numbers and the preview", () => {
    expect(workbench.split("<ImportFormatNote").length - 1).toBe(1);

    expect(workbench).toContain("function ImportFormatNote({");

    expect(squash(workbench)).toContain("describeDelimiter(delimiter,)");

    expect(squash(workbench)).toContain("if(note===null){returnnull;}");

    expect(squash(workbench)).toContain("delimiter={validation.result.delimiter}");

    expect(workbench).toContain('data-slot="import-format-note"');

    expect(squash(workbench)).toContain("{note}");

    expect(workbench).toContain(
      'className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"',
    );

    const ready = workbench.indexOf('"READY TO APPLY"');

    const note = workbench.indexOf("<ImportFormatNote");

    const preview = workbench.indexOf("First eight rows only.");

    expect(ready).toBeGreaterThan(-1);

    expect(note).toBeGreaterThan(ready);

    expect(preview).toBeGreaterThan(note);
  });
});

describe("the README", () => {
  const section = readmeSection("Import files saved by Excel in other languages");

  it("explains the problem, the four fixes, the rules and the limits", () => {
    for (const piece of [
      'Missing required CSV headers: period."',
      "`detectCsvDelimiter()`",
      "`lib/data-import/delimiter.ts`",
      "`parseCsvMatrix()` and `csvRecords()`",
      "`lib/data-import/csv.ts`",
      "`NUMBER_FIELDS`",
      "`lib/data-import/number.ts`",
      "In a file with semicolons a comma is always the decimal mark",
      "1250,50 is 1250.50",
      "1,250 is 1.250",
      "In a file with commas or tabs, 1,250 (in quotes) is a group of thousands",
      "1.250 can be a thousands mark (a German file) or a decimal point (a file from a script)",
      "The import does not guess",
      "`decodeCsvBytes()`",
      "`lib/data-import/decode.ts`",
      "Windows-1252",
      'save the file as "CSV UTF-8"',
      "also takes .tsv and .txt files",
      "A normal comma file is read as before",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its five test files", () => {
    for (const name of [
      "delimiter.test.ts",
      "decode.test.ts",
      "number.test.ts",
      "spreadsheet-import.test.ts",
      "spreadsheet-import-source.test.ts",
    ]) {
      expect(section, name).toContain(`\`tests/data-import/${name}\``);
    }
  });

  it("comes after the paste section and before the download section", () => {
    const paste = readme.indexOf("## Paste numbers from a spreadsheet");

    const here = readme.indexOf("## Import files saved by Excel in other languages");

    const download = readme.indexOf("## Download your data");

    expect(paste).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(paste);

    expect(download).toBeGreaterThan(here);
  });
});
