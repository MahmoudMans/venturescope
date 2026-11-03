import { describe, expect, it } from "vitest";

import { decodeCsvBytes } from "@/lib/data-import/decode";
import { actualPeriodKey, parseActualsCsv } from "@/lib/finance/actuals";
import { parseCsvTable } from "@/lib/finance/analytics/csv";

const NBSP = String.fromCharCode(0xa0);

const E_ACUTE = String.fromCharCode(0xe9);

function read(csv: string) {
  return parseActualsCsv(csv).map((row) => ({
    month: actualPeriodKey(row.period),
    revenue: row.revenue,
    cogs: row.cogs,
    cashBalance: row.cashBalance,
    customers: row.customers,
  }));
}

function message(csv: string): string {
  try {
    parseActualsCsv(csv);
  } catch (cause) {
    return cause instanceof Error ? cause.message : "not an error";
  }

  return "no error";
}

describe("an Actuals file saved by Excel with French settings", () => {
  const csv = [
    "Month;Revenue;COGS;Cash Balance;Customers",
    `janv.-27;1${NBSP}250,50;300,25;(2 000,00);1 200`,
    `f${E_ACUTE}vr.-27;1300,00;310;-100,00;10`,
    "",
  ].join("\r\n");

  it("is read with its semicolons, its decimal commas and its months", () => {
    expect(read(csv)).toEqual([
      { month: "2027-01", revenue: 1250.5, cogs: 300.25, cashBalance: -2000, customers: 1200 },
      { month: "2027-02", revenue: 1300, cogs: 310, cashBalance: -100, customers: 10 },
    ]);
  });

  it("reads dates with the day first", () => {
    const rows = read("Month;Revenue\r\n01/01/2027;1250,50\r\n01/02/2027;1300,00\r\n01/03/2027;5");

    expect(rows.map((row) => row.month)).toEqual(["2027-01", "2027-02", "2027-03"]);

    expect(rows.map((row) => row.revenue)).toEqual([1250.5, 1300, 5]);
  });

  it("reads a lone date with the day first, because the file has semicolons", () => {
    expect(read("Month;Revenue\r\n03/04/2027;5")[0].month).toBe("2027-04");
  });

  it("skips title lines before the header", () => {
    const rows = read("Acme report;;;\r\nMonth;Revenue\r\njanv.-27;5\r\n");

    expect(rows).toHaveLength(1);

    expect(rows[0].month).toBe("2027-01");
  });

  it("reads a decimal comma in each of the nine number columns", () => {
    const csv = [
      "Month;Revenue;COGS;Operating Expenses;EBITDA;Net Income;Cash Flow;Cash Balance;MRR;Customers",
      "janv.-27;1,5;2,5;3,5;4,5;5,5;6,5;7,5;8,5;9",
    ].join("\r\n");

    const row = parseActualsCsv(csv)[0];

    expect([
      row.revenue,
      row.cogs,
      row.operatingExpenses,
      row.ebitda,
      row.netIncome,
      row.cashFlow,
      row.cashBalance,
      row.mrr,
      row.customers,
    ]).toEqual([1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9]);
  });

  it("reads a number column that comes before the month column", () => {
    const rows = read("Revenue;Month\r\n1250,50;janv.-27");

    expect(rows.map((row) => [row.month, row.revenue])).toEqual([["2027-01", 1250.5]]);
  });

  it("does not read the numbers of a row that has no month, and tells the row", () => {
    expect(message("Month;Revenue\r\njanv.-27;5\r\n;1,250,000")).toBe(
      "Row 3: This row has values but no month. Add the month, or delete the row.",
    );
  });

  it("reads a plain number with a dot, and a number with a currency sign", () => {
    expect(read("Month;Revenue\r\njanv.-27;1250.5")[0].revenue).toBe(1250.5);

    expect(read("Month;Revenue\r\njanv.-27;TND 1 250,500")[0].revenue).toBe(1250.5);
  });

  it("is read the same way with a byte order mark", () => {
    expect(read(`${String.fromCharCode(0xfeff)}${csv}`)).toHaveLength(2);
  });

  it("does not read 1,250,000 and does not remove its commas", () => {
    expect(message("Month;Revenue\r\njanv.-27;1,250,000")).toBe(
      "Invalid financial number: 1,250,000",
    );
  });

  it("does not guess a dot with exactly three digits after it", () => {
    expect(message("Month;Revenue\r\njanv.-27;1.250")).toBe(
      '"1.250" is not clear. Write 1250 if the dot is a thousands mark, or 1,250 if it is a decimal point.',
    );
  });

  it("refuses a customer count with decimals", () => {
    expect(message("Month;Customers\r\njanv.-27;10,5")).toBe(
      "Customers must be a non-negative integer for 2027-01.",
    );
  });

  it("still gives null for an empty cell, a dash and n/a", () => {
    const rows = read(`Month;Revenue;COGS;Customers\r\njanv.-27;;-;n/a\r\nf${E_ACUTE}vr.-27;5;;`);

    expect(rows).toHaveLength(1);

    expect(rows[0].month).toBe("2027-02");
  });
});

describe("an Actuals file in a text format", () => {
  it("is read when it uses tabs, and a decimal comma works", () => {
    const rows = read("Month\tRevenue\tCOGS\r\nJan-27\t1250,50\t(300)\r\n");

    expect(rows).toEqual([
      { month: "2027-01", revenue: 1250.5, cogs: -300, cashBalance: null, customers: null },
    ]);
  });

  it("is read when it is Unicode Text of Excel (UTF-16 with a byte order mark)", () => {
    const bytes = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from("Month\tRevenue\r\njanv.-27\t1250,50\r\n", "utf16le"),
    ]);

    const rows = read(decodeCsvBytes(new Uint8Array(bytes)));

    expect(rows.map((row) => [row.month, row.revenue])).toEqual([["2027-01", 1250.5]]);
  });

  it("is read when it is Windows-1252 with accents in a title line", () => {
    const bytes = Buffer.from(`R${E_ACUTE}sultats;;\r\nMonth;Revenue\r\njanv.-27;5\r\n`, "latin1");

    expect(read(decodeCsvBytes(new Uint8Array(bytes)))).toHaveLength(1);
  });
});

describe("an Actuals file with commas", () => {
  it("reads the months that Excel writes", () => {
    const rows = read("Month,Revenue\r\nJan-27,1000\r\nFeb-27,1100\r\nMar-27,1200");

    expect(rows.map((row) => row.month)).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("reads dates of the United States, because no month can repeat", () => {
    const rows = read("Month,Revenue\r\n1/1/2027,1000\r\n2/1/2027,1100\r\n3/1/2027,1200");

    expect(rows.map((row) => row.month)).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("reads dates of France, because no month can repeat", () => {
    const rows = read("Month,Revenue\r\n01/01/2027,1000\r\n01/02/2027,1100\r\n01/03/2027,1200");

    expect(rows.map((row) => row.month)).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("reads the last day of each month", () => {
    const rows = read("Month,Revenue\r\n31/01/2027,1000\r\n28/02/2027,1100");

    expect(rows.map((row) => row.month)).toEqual(["2027-01", "2027-02"]);
  });

  it("does not guess one date that can be read in two ways", () => {
    expect(message("Month,Revenue\r\n03/04/2027,1000")).toBe(
      '"03/04/2027" is not clear. Write 2027-04 if it is 3 April, or 2027-03 if it is 4 March.',
    );
  });

  it("refuses dates that use both orders", () => {
    expect(message("Month,Revenue\r\n31/01/2027,1000\r\n02/28/2027,1100")).toBe(
      "The dates in this column are written in two different orders (day first and month first), so they cannot be read. Write each month as 2027-01.",
    );
  });

  it("still refuses a month that is not a month", () => {
    expect(message("Month,Revenue\r\nNotAMonth,1000")).toBe(
      "Invalid actuals month: NotAMonth (row 2). If it is a total row, remove it.",
    );
  });

  it("still refuses two rows for the same month, also when one is a date", () => {
    expect(message("Month,Revenue\r\n2027-01,1000\r\n31/01/2027,1100")).toBe(
      "Actuals CSV contains duplicate month 2027-01.",
    );
  });

  it("reads thousands marks and brackets as before", () => {
    const csv = ["Month,Revenue,COGS,Cash Balance", '2027-01,"1,250.50","(1,200)",$3000'].join(
      "\n",
    );

    const row = read(csv)[0];

    expect([row.revenue, row.cogs, row.cashBalance]).toEqual([1250.5, -1200, 3000]);
  });

  it("reads a quoted decimal comma as a decimal, and not as 125050", () => {
    const row = read('Month,Revenue,COGS\n2027-01,"1250,50","12,5"')[0];

    expect([row.revenue, row.cogs]).toEqual([1250.5, 12.5]);
  });

  it("still removes a comma that makes a group that is not a group of thousands", () => {
    expect(read('Month,Revenue\n2027-01,"1,25,000"')[0].revenue).toBe(125000);
  });

  it("does not change a number that is already plain", () => {
    const row = read("Month,Revenue,COGS\n2027-01,1250.5,-7")[0];

    expect([row.revenue, row.cogs]).toEqual([1250.5, -7]);
  });

  it("reads a column of numbers that comes before the month column", () => {
    const rows = read("Revenue,Month\n1000,Jan-27");

    expect(rows).toEqual([
      { month: "2027-01", revenue: 1000, cogs: null, cashBalance: null, customers: null },
    ]);
  });

  it("refuses a number that is too big", () => {
    expect(message("Month,Revenue\n2027-01,2000000000000000")).toBe(
      "Invalid financial number: 2000000000000000",
    );
  });

  it("refuses a number that is not a number", () => {
    expect(message("Month,Revenue\n2027-01,abc")).toBe("Invalid financial number: abc");
  });
});

describe("parseCsvTable with another mark", () => {
  it("splits at the mark that it is given", () => {
    expect(parseCsvTable("a;b\n1;2", ";")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);

    expect(parseCsvTable("a\tb\n1\t2", "\t")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("does not split inside quotes, and a comma is a letter in a file with semicolons", () => {
    expect(parseCsvTable('"a;b";c,d\n1;2', ";")).toEqual([
      ["a;b", "c,d"],
      ["1", "2"],
    ]);
  });

  it("splits at commas when no mark is given, as before", () => {
    expect(parseCsvTable("a,b;c\n1,2")).toEqual([
      ["a", "b;c"],
      ["1", "2"],
    ]);
  });
});
