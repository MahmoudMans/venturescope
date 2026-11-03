import { describe, expect, it } from "vitest";

import { NUMBER_FIELDS, readImportNumber, readRecordNumbers } from "@/lib/data-import/number";

const NBSP = String.fromCharCode(0xa0);

const NARROW_NBSP = String.fromCharCode(0x202f);

function text(raw: string, decimalComma: boolean): string {
  const read = readImportNumber(raw, decimalComma);

  if (read.ok === false) {
    throw new Error(`not read: ${read.message}`);
  }

  return read.text;
}

describe("readImportNumber: a file with commas or tabs", () => {
  const cases: [string, string][] = [
    ["1250", "1250"],
    ["1250.5", "1250.5"],
    ["1.250", "1.250"],
    ["-5", "-5"],
    ["1,250", "1250"],
    ["1,250,000.50", "1250000.50"],
    ["(1,200)", "-1200"],
    ["1 250,50", "1250.50"],
    ["1250,50", "1250.50"],
    ["20%", "20"],
    ["$1,250", "1250"],
    ["abc", "abc"],
    ["1,2,3", "1,2,3"],
    ["", ""],
    ["   ", "   "],
  ];

  it("reads the formats of a spreadsheet and leaves the rest as it is", () => {
    for (const [raw, expected] of cases) {
      expect(text(raw, false), JSON.stringify(raw)).toBe(expected);
    }
  });
});

describe("readImportNumber: a file with semicolons", () => {
  const cases: [string, string][] = [
    ["1250", "1250"],
    ["1250,50", "1250.50"],
    ["0,5", "0.5"],
    ["1,250", "1.250"],
    [`1${NBSP}250,50`, "1250.50"],
    [`1${NARROW_NBSP}250,50`, "1250.50"],
    ["1 250,50", "1250.50"],
    ["1 250.50", "1250.50"],
    ["1.250,50", "1250.50"],
    ["1.250.000", "1250000"],
    ["1250.5", "1250.5"],
    ["1250.500", "1250.500"],
    ["1.25", "1.25"],
    ["12.5", "12.5"],
    ["1.2500", "1.2500"],
    [" abc ", " abc "],
    ["(1 200,00)", "-1200.00"],
    ["-1 200,50", "-1200.50"],
    ["1200,50-", "-1200.50"],
    ["TND 1 250,500", "1250.500"],
    ["12,5 %", "12.5"],
    ["1,250,000", "1,250,000"],
    ["1,250,000.50", "1,250,000.50"],
    ["abc", "abc"],
  ];

  it("reads a comma as the decimal mark and never as a group of thousands", () => {
    for (const [raw, expected] of cases) {
      expect(text(raw, true), JSON.stringify(raw)).toBe(expected);
    }
  });

  it("does not guess when one dot has exactly three digits after it", () => {
    for (const raw of ["1.250", "12.345", "123.456", "-1.250", "+1.250", " 1.250 "]) {
      const read = readImportNumber(raw, true);

      expect(read.ok, JSON.stringify(raw)).toBe(false);
    }
  });

  it("tells the person how to write the number", () => {
    const read = readImportNumber("1.250", true);

    expect(read).toEqual({
      ok: false,
      message:
        '"1.250" is not clear. Write 1250 if the dot is a thousands mark, or 1,250 if it is a decimal point.',
    });

    expect(readImportNumber("-12.345", true)).toEqual({
      ok: false,
      message:
        '"-12.345" is not clear. Write -12345 if the dot is a thousands mark, or -12,345 if it is a decimal point.',
    });
  });

  it("reads the same text as a decimal point in a file with commas", () => {
    expect(text("1.250", false)).toBe("1.250");
  });
});

describe("readRecordNumbers", () => {
  it("reads only the number columns of an Actuals row", () => {
    const record = {
      period: "2027-01",
      revenue: "1 250,50",
      cogs: "300,25",
      customers: "1 200",
      note: "1,250 units",
    };

    const read = readRecordNumbers("ACTUALS", record, true);

    expect(read.problems).toEqual([]);

    expect(read.record).toEqual({
      period: "2027-01",
      revenue: "1250.50",
      cogs: "300.25",
      customers: "1200",
      note: "1,250 units",
    });
  });

  it("does not change the row that it was given", () => {
    const record = { revenue: "1 250,50" };

    readRecordNumbers("ACTUALS", record, true);

    expect(record).toEqual({ revenue: "1 250,50" });
  });

  it("reads the target of a KPI row", () => {
    expect(readRecordNumbers("KPI_TARGETS", { targetValue: "20,5" }, true).record).toEqual({
      targetValue: "20.5",
    });
  });

  it("does not read a text column as a number, even when it looks like one", () => {
    const record = {
      targetValue: "5",
      note: "(5)",
      ownerName: "1.250",
      metricCode: "20%",
    };

    const read = readRecordNumbers("KPI_TARGETS", record, true);

    expect(read.problems).toEqual([]);

    expect(read.record).toEqual({
      targetValue: "5",
      note: "(5)",
      ownerName: "1.250",
      metricCode: "20%",
    });
  });

  it("does not touch the text of a variance row", () => {
    const record = {
      explanation: "Sales fell 1,250 units",
      status: "MONITORING",
    };

    expect(readRecordNumbers("VARIANCE_COMMENTARY", record, true).record).toEqual(record);
  });

  it("gives a problem for each number that is not clear and keeps its text", () => {
    const read = readRecordNumbers("ACTUALS", { revenue: "1.250", cogs: "2.000", mrr: "5" }, true);

    expect(read.problems.map((problem) => problem.field)).toEqual(["revenue", "cogs"]);

    expect(read.problems[0].message).toContain('"1.250" is not clear');

    expect(read.record).toEqual({ revenue: "1.250", cogs: "2.000", mrr: "5" });
  });

  it("skips a column that is not in the row", () => {
    expect(readRecordNumbers("ACTUALS", { period: "2027-01" }, true)).toEqual({
      record: { period: "2027-01" },
      problems: [],
      emptied: 0,
    });
  });
});

describe("NUMBER_FIELDS", () => {
  it("lists the number columns of each kind of import", () => {
    expect(NUMBER_FIELDS.ACTUALS).toEqual([
      "revenue",
      "cogs",
      "operatingExpenses",
      "ebitda",
      "netIncome",
      "cashFlow",
      "cashBalance",
      "mrr",
      "customers",
    ]);

    expect(NUMBER_FIELDS.KPI_TARGETS).toEqual(["targetValue"]);

    expect(NUMBER_FIELDS.VARIANCE_COMMENTARY).toEqual([]);
  });
});
