import { describe, expect, it } from "vitest";

import {
  CSV_BYTE_ORDER_MARK,
  csvCell,
  neutralizeFormula,
  toCsv,
  type CsvColumn,
} from "@/lib/account/csv-text";
import { csvRecords } from "@/lib/data-import/csv";

const COLUMNS: CsvColumn[] = [
  { header: "code", kind: "plain" },
  { header: "amount", kind: "plain" },
  { header: "note", kind: "text" },
];

describe("neutralizeFormula", () => {
  it("puts a quote in front of text that a spreadsheet would run", () => {
    for (const start of ["=", "+", "-", "@"]) {
      expect(neutralizeFormula(`${start}SUM(A1:A9)`)).toBe(`'${start}SUM(A1:A9)`);
    }

    expect(neutralizeFormula('=HYPERLINK("http://example.com")')).toBe(
      '\'=HYPERLINK("http://example.com")',
    );
  });

  it("also covers a tab or a line break at the start", () => {
    expect(neutralizeFormula("\t=1+1")).toBe("'\t=1+1");

    expect(neutralizeFormula("\r=1+1")).toBe("'\r=1+1");
  });

  it("leaves normal text alone", () => {
    expect(neutralizeFormula("Pipeline below plan")).toBe("Pipeline below plan");

    expect(neutralizeFormula("a-b = c")).toBe("a-b = c");

    expect(neutralizeFormula("")).toBe("");
  });
});

describe("csvCell", () => {
  it("writes nothing for a missing value", () => {
    expect(csvCell(null, "text")).toBe("");

    expect(csvCell(undefined, "plain")).toBe("");

    expect(csvCell(Number.NaN, "plain")).toBe("");

    expect(csvCell(Number.POSITIVE_INFINITY, "plain")).toBe("");
  });

  it("writes numbers as they are, including negative numbers", () => {
    expect(csvCell(42, "plain")).toBe("42");

    expect(csvCell(-1500.5, "plain")).toBe("-1500.5");

    expect(csvCell("-1500.5", "plain")).toBe("-1500.5");

    expect(csvCell(0, "plain")).toBe("0");
  });

  it("quotes a value with a comma, a quote or a line break", () => {
    expect(csvCell("a,b", "text")).toBe('"a,b"');

    expect(csvCell('say "hi"', "text")).toBe('"say ""hi"""');

    expect(csvCell("line one\nline two", "text")).toBe('"line one\nline two"');

    expect(csvCell("line one\r\nline two", "text")).toBe('"line one\r\nline two"');

    expect(csvCell("old\rstyle", "text")).toBe('"old\rstyle"');
  });

  it("neutralizes formulas only in text columns", () => {
    expect(csvCell("-5% below plan", "text")).toBe("'-5% below plan");

    expect(csvCell("-5", "plain")).toBe("-5");
  });
});

describe("toCsv", () => {
  it("starts with the mark for Excel, then the header line", () => {
    const csv = toCsv(COLUMNS, []);

    expect(csv.startsWith(CSV_BYTE_ORDER_MARK)).toBe(true);

    expect(csv).toBe(`${CSV_BYTE_ORDER_MARK}code,amount,note\n`);
  });

  it("writes one line for each row and ends with a line break", () => {
    const csv = toCsv(COLUMNS, [
      ["A", 1, "first"],
      ["B", -2.5, null],
    ]);

    expect(csv.slice(1)).toBe("code,amount,note\nA,1,first\nB,-2.5,\n");
  });

  it("fills missing cells with nothing", () => {
    expect(toCsv(COLUMNS, [["A"]]).slice(1)).toBe("code,amount,note\nA,,\n");
  });

  it("can be read back by the CSV reader of the Data Import Center", () => {
    const csv = toCsv(COLUMNS, [
      ["A", 10, 'He said "yes", then left'],
      ["B", -3, "two\nlines"],
      ["C", "", "plain note"],
    ]);

    const { headers, records } = csvRecords(csv);

    expect(headers).toEqual(["code", "amount", "note"]);

    expect(records).toEqual([
      { code: "A", amount: "10", note: 'He said "yes", then left' },
      { code: "B", amount: "-3", note: "two\nlines" },
      { code: "C", amount: "", note: "plain note" },
    ]);
  });

  it("keeps a dangerous note readable but harmless", () => {
    const { records } = csvRecords(toCsv(COLUMNS, [["A", 1, "=cmd|' /C calc'"]]));

    expect(records[0].note).toBe("'=cmd|' /C calc'");
  });
});
