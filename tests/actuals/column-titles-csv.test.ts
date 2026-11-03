import { describe, expect, it } from "vitest";

import { actualPeriodKey, parseActualsCsv } from "@/lib/finance/actuals";

const E_ACUTE = String.fromCharCode(0xe9);

const U_CIRCUMFLEX = String.fromCharCode(0xfb);

function firstRow(csv: string) {
  const row = parseActualsCsv(csv)[0];

  return { ...row, month: actualPeriodKey(row.period) };
}

function messageOf(csv: string): string {
  try {
    parseActualsCsv(csv);
  } catch (cause) {
    return cause instanceof Error ? cause.message : "not an error";
  }

  return "no error";
}

describe("the Actuals page with column titles in French", () => {
  it("reads the titles of a French Excel file, with accents and apostrophes", () => {
    const csv = [
      `P${E_ACUTE}riode;Chiffre d'affaires;Charges d'exploitation;Tr${E_ACUTE}sorerie;Clients`,
      "janv.-27;1250,50;300;5;12",
    ].join("\r\n");

    const row = firstRow(csv);

    expect([row.month, row.revenue, row.operatingExpenses, row.cashBalance, row.customers]).toEqual(
      ["2027-01", 1250.5, 300, 5, 12],
    );
  });

  it("reads one French title for each of the nine number columns", () => {
    const titles: [string, string][] = [
      ["Ventes", "revenue"],
      [`Co${U_CIRCUMFLEX}t des ventes`, "cogs"],
      ["Charges d'exploitation", "operatingExpenses"],
      ["EBE", "ebitda"],
      [`R${E_ACUTE}sultat net`, "netIncome"],
      [`Flux de tr${E_ACUTE}sorerie`, "cashFlow"],
      [`Solde de tr${E_ACUTE}sorerie`, "cashBalance"],
      [`Revenu r${E_ACUTE}current mensuel`, "mrr"],
      ["Clients actifs", "customers"],
    ];

    for (const [title, field] of titles) {
      const row = firstRow(`Mois;${title}\r\njanv.-27;7`) as unknown as Record<string, unknown>;

      expect(row[field], title).toBe(7);
    }
  });

  it("finds the title row below some lines of text", () => {
    const rows = parseActualsCsv("Rapport 2027;;\r\nMois;CA\r\njanv.-27;5");

    expect(rows).toHaveLength(1);

    expect(rows[0].revenue).toBe(5);
  });

  it("reads English titles written in capitals or with other marks", () => {
    const row = firstRow("MONTH;NET INCOME;Cash_Flow\r\n2027-01;5;6");

    expect([row.month, row.netIncome, row.cashFlow]).toEqual(["2027-01", 5, 6]);
  });
});

describe("the Actuals page with the titles that it read before", () => {
  it("reads the English titles as before", () => {
    const row = firstRow("Month,Sales,Opex,Net Profit,Active Customers\n2027-01,1,2,3,4");

    expect([row.revenue, row.operatingExpenses, row.netIncome, row.customers]).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("takes Month before Period when a file has both, as before", () => {
    expect(firstRow("Month,Period,Revenue\nJan-27,2027-05,100").month).toBe("2027-01");

    expect(firstRow("Date,Period,Revenue\n2027-04,2027-05,100").month).toBe("2027-05");
  });

  it("still tells when no title row is found", () => {
    expect(messageOf("Foo,Bar\n1,2")).toBe(
      "Actuals CSV must contain Month/Period and at least one financial metric column.",
    );
  });

  it("does not take a title row that has a month column and nothing else", () => {
    expect(messageOf("Mois;Foo\njanv.-27;1")).toBe(
      "Actuals CSV must contain Month/Period and at least one financial metric column.",
    );
  });
});
