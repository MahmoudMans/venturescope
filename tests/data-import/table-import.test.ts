import { describe, expect, it } from "vitest";

import { DATA_IMPORT_TEMPLATE } from "@/lib/data-import/catalog";
import { validateDataImportCsv } from "@/lib/data-import/validation";
import { actualPeriodKey, parseActualsCsv } from "@/lib/finance/actuals";

const EM_DASH = String.fromCharCode(0x2014);

const EN_DASH = String.fromCharCode(0x2013);

type ImportType = "ACTUALS" | "KPI_TARGETS" | "VARIANCE_COMMENTARY";

function validate(importType: ImportType, csv: string) {
  return validateDataImportCsv({ importType, csv });
}

function errorOf(importType: ImportType, csv: string): string {
  try {
    validate(importType, csv);
  } catch (cause) {
    return cause instanceof Error ? cause.message : "not an error";
  }

  return "no error";
}

function actualsOf(csv: string) {
  return validate("ACTUALS", csv).rows.map((row) =>
    row.kind === "ACTUALS" ? [row.periodKey, row.revenue, row.cogs] : [],
  );
}

function pageError(csv: string): string {
  try {
    parseActualsCsv(csv);
  } catch (cause) {
    return cause instanceof Error ? cause.message : "not an error";
  }

  return "no error";
}

function pageRows(csv: string) {
  return parseActualsCsv(csv).map((row) => [actualPeriodKey(row.period), row.revenue, row.cogs]);
}

describe("an Actuals file with lines above the column titles", () => {
  it("reads a report name and an empty line above the titles", () => {
    const csv = ["Acme - Monthly figures", "", "period,revenue,cogs", "2027-01,1000,300"].join(
      "\n",
    );

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([]);

    expect(actualsOf(csv)).toEqual([["2027-01", 1000, 300]]);

    expect(result.layout).toEqual({ titleRow: 3, emptyColumns: 0, emptyNumbers: 0 });

    expect(result.headers).toEqual(["period", "revenue", "cogs"]);
  });

  it("reads a semicolon file under a title line, which has no semicolon in it", () => {
    const csv = ["Chiffres du mois", "Mois;Revenue;COGS", "janv.-27;1250,50;300,25"].join("\r\n");

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([]);

    expect(result.delimiter).toBe(";");

    expect(actualsOf(csv)).toEqual([["2027-01", 1250.5, 300.25]]);

    expect(result.layout.titleRow).toBe(2);
  });

  it("reads a title line that has a comma in it above a semicolon file", () => {
    const csv = ["Acme, Inc.", "period;revenue;cogs", "2027-01;1250,50;300"].join("\n");

    expect(actualsOf(csv)).toEqual([["2027-01", 1250.5, 300]]);
  });

  it("reads several lines above the titles", () => {
    const csv = ["Report", "Company: Acme", "Year: 2027", "", "period;revenue", "2027-01;100"].join(
      "\n",
    );

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([]);

    expect(result.layout.titleRow).toBe(5);

    expect(result.rowCount).toBe(1);
  });

  it("reads the line sep=; that Excel can write, and does not count it as a row", () => {
    const csv = ["sep=;", "period;revenue;cogs", "2027-01;1000;300", "2027-02;abc;300"].join("\n");

    const result = validate("ACTUALS", csv);

    expect(result.delimiter).toBe(";");

    expect(result.layout.titleRow).toBe(1);

    expect(result.issues.map((issue) => `${issue.row}:${issue.field}`)).toEqual(["3:revenue"]);
  });

  it("tells the row of a problem as the sheet counts it, also below an empty row", () => {
    const csv = ["Report", "period,revenue", "2027-01,100", "", "2027-02,abc"].join("\n");

    const issues = validate("ACTUALS", csv).issues;

    expect(issues.map((issue) => `${issue.row}:${issue.field}`)).toEqual(["5:revenue"]);
  });

  it("tells the row of a problem in the file when there are no lines above", () => {
    const csv = ["period,revenue", "2027-01,100", "", "", "2027-02,abc"].join("\n");

    expect(validate("ACTUALS", csv).issues.map((issue) => issue.row)).toEqual([5]);
  });

  it("tells the row of two months that are the same", () => {
    const csv = ["Report", "period,revenue", "2027-01,100", "2027-01,110"].join("\n");

    expect(validate("ACTUALS", csv).issues).toEqual([
      { row: 4, field: "duplicate", message: "Duplicate import key: 2027-01." },
    ]);
  });

  it("tells the row of a total row at the bottom, and keeps the other rows", () => {
    const csv = ["Report", "", "period,revenue", "2027-01,100", "Total,100"].join("\n");

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([
      { row: 5, field: "period", message: "period must be a valid month." },
    ]);

    expect(result.rows).toHaveLength(1);
  });

  it("still says which titles are missing in a file that has no table", () => {
    expect(errorOf("ACTUALS", "Just a note\nanother note")).toBe(
      "Missing required CSV headers: period. Other titles that are read: period = month, date, mois, periode.",
    );
  });

  it("tells that a file with titles and no number column has no numbers", () => {
    expect(errorOf("ACTUALS", "Report\nperiod,notes\n2027-01,hello")).toBe(
      "No column with numbers was found. Use at least one of these titles: revenue, cogs, operatingExpenses, ebitda, netIncome, cashFlow, cashBalance, mrr, customers.",
    );
  });

  it("gives no rows for a file with titles and nothing else", () => {
    const result = validate("ACTUALS", "Report\nperiod,revenue");

    expect(result.rowCount).toBe(0);

    expect(result.issues).toEqual([]);

    expect(result.layout.titleRow).toBe(2);
  });
});

describe("a KPI file and a variance file with lines above the column titles", () => {
  it("reads a KPI file under a title line", () => {
    const csv = ["KPI plan 2027", "Mois;Indicateur;Objectif", "janv.-27;Marge EBITDA;20,5"].join(
      "\n",
    );

    const result = validate("KPI_TARGETS", csv);

    expect(result.issues).toEqual([]);

    expect(result.layout.titleRow).toBe(2);

    const row = result.rows[0];

    expect(row.kind === "KPI_TARGETS" ? [row.metricCode, row.targetValue] : []).toEqual([
      "EBITDA_MARGIN",
      0.205,
    ]);
  });

  it("reads a variance file under a title line", () => {
    const csv = [
      "Variance review",
      "periodKey,metricCode,causeCode,varianceNature,explanation,status",
      "2027-01,REVENUE,VOLUME,RECURRING,Pipeline fell short,MONITORING",
    ].join("\n");

    const result = validate("VARIANCE_COMMENTARY", csv);

    expect(result.issues).toEqual([]);

    expect(result.rows).toHaveLength(1);

    expect(result.layout.titleRow).toBe(2);
  });

  it("names the title that is missing, also when lines stand above the titles", () => {
    const csv = [
      "Report",
      "periodKey,metricCode,causeCode,varianceNature,explanation",
      "2027-01,REVENUE,VOLUME,RECURRING,Pipeline fell short",
    ].join("\n");

    expect(errorOf("VARIANCE_COMMENTARY", csv)).toBe(
      "Missing required CSV headers: status. Other titles that are read: status = statut.",
    );
  });

  it("tells the row of a KPI that is not valid below the lines", () => {
    const csv = ["Plan", "", "periodKey,metricCode,targetValue", "2027-01,Revnue,100"].join("\n");

    const issues = validate("KPI_TARGETS", csv).issues;

    expect(issues.map((issue) => `${issue.row}:${issue.field}`)).toEqual(["4:metricCode"]);
  });
});

describe("empty columns", () => {
  it("leaves out the empty cells that Excel keeps at the end of the rows", () => {
    const csv = ["period;revenue;cogs;;", "2027-01;1000;300;;", "2027-02;1100;310;;"].join("\r\n");

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([]);

    expect(result.headers).toEqual(["period", "revenue", "cogs"]);

    expect(result.layout.emptyColumns).toBe(2);

    expect(result.rowCount).toBe(2);
  });

  it("leaves out an empty column in the middle", () => {
    const csv = ["period;;revenue", "2027-01;;1000"].join("\n");

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([]);

    expect(actualsOf(csv)).toEqual([["2027-01", 1000, null]]);

    expect(result.layout.emptyColumns).toBe(1);
  });

  it("still refuses a column that has values and no title", () => {
    expect(errorOf("ACTUALS", "period,revenue,\n2027-01,100,note")).toBe(
      "CSV contains an empty header.",
    );
  });

  it("tells nothing for the three templates", () => {
    for (const type of ["ACTUALS", "KPI_TARGETS", "VARIANCE_COMMENTARY"] as const) {
      const result = validate(type, DATA_IMPORT_TEMPLATE[type]);

      expect(result.issues, type).toEqual([]);

      expect(result.layout, type).toEqual({ titleRow: 1, emptyColumns: 0, emptyNumbers: 0 });
    }
  });
});

describe("a dash or n/a instead of a number", () => {
  it("reads a dash, a long dash and n/a in an Actuals file as no number", () => {
    const csv = [
      "period,revenue,cogs,ebitda",
      "2027-01,1000,-,n/a",
      `2027-02,1100,${EM_DASH},${EN_DASH}`,
      "2027-03,1200,N/A,300",
    ].join("\n");

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([]);

    expect(result.rows).toHaveLength(3);

    expect(actualsOf(csv)).toEqual([
      ["2027-01", 1000, null],
      ["2027-02", 1100, null],
      ["2027-03", 1200, null],
    ]);

    expect(result.layout.emptyNumbers).toBe(5);
  });

  it("does not count an empty cell, and does not change a number", () => {
    const csv = ["period,revenue,cogs", "2027-01,1000,", "2027-02,-5,300"].join("\n");

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([]);

    expect(result.layout.emptyNumbers).toBe(0);

    expect(actualsOf(csv)).toEqual([
      ["2027-01", 1000, null],
      ["2027-02", -5, 300],
    ]);
  });

  it("keeps the dash in the preview, as the file has it", () => {
    const result = validate("ACTUALS", "period,revenue,cogs\n2027-01,1000,-");

    expect(result.preview[0]).toEqual({ period: "2027-01", revenue: "1000", cogs: "-" });
  });

  it("still refuses a dash for the target of a KPI", () => {
    const csv = "periodKey,metricCode,targetValue\n2027-01,REVENUE,-";

    expect(validate("KPI_TARGETS", csv).issues).toEqual([
      { row: 2, field: "targetValue", message: "KPI target must be a valid number." },
    ]);

    expect(validate("KPI_TARGETS", csv).layout.emptyNumbers).toBe(0);
  });

  it("still refuses text that is not a number", () => {
    const issues = validate("ACTUALS", "period,revenue\n2027-01,abc").issues;

    expect(issues.map((issue) => `${issue.row}:${issue.field}`)).toEqual(["2:revenue"]);
  });

  it("keeps the semicolon rules for the other numbers of the same row", () => {
    const csv = ["Mois;Revenue;COGS", "janv.-27;1250,50 DT;-"].join("\n");

    expect(actualsOf(csv)).toEqual([["2027-01", 1250.5, null]]);
  });
});

describe("the Actuals page with lines above the column titles", () => {
  it("reads a title line above a semicolon file", () => {
    const csv = ["Chiffres 2027", "Mois;Revenue;COGS", "janv.-27;1250,50;300,25"].join("\r\n");

    expect(pageRows(csv)).toEqual([["2027-01", 1250.5, 300.25]]);
  });

  it("reads a title line and an empty line above a comma file", () => {
    const csv = ["Report", "", "Month,Revenue,COGS", "2027-01,1000,300"].join("\n");

    expect(pageRows(csv)).toEqual([["2027-01", 1000, 300]]);
  });

  it("reads the line sep=; and the empty cells at the end of the rows", () => {
    const csv = ["sep=;", "Month;Revenue;COGS;;", "2027-01;1000;300;;"].join("\n");

    expect(pageRows(csv)).toEqual([["2027-01", 1000, 300]]);
  });

  it("reads a dash, a long dash and n/a as no number", () => {
    const csv = [
      "Month,Revenue,COGS",
      "2027-01,1000,-",
      `2027-02,1100,${EM_DASH}`,
      "2027-03,n/a,5",
    ].join("\n");

    expect(pageRows(csv)).toEqual([
      ["2027-01", 1000, null],
      ["2027-02", 1100, null],
      ["2027-03", null, 5],
    ]);
  });

  it("names the row of a month that is not a month, and tells to remove a total row", () => {
    const csv = ["Report", "Month,Revenue", "2027-01,100", "2027-02,110", "Total,210"].join("\n");

    expect(pageError(csv)).toBe(
      "Invalid actuals month: Total (row 5). If it is a total row, remove it.",
    );
  });

  it("names the row also when the file starts with its titles", () => {
    expect(pageError("Month,Revenue\r\nNotAMonth,1000")).toBe(
      "Invalid actuals month: NotAMonth (row 2). If it is a total row, remove it.",
    );
  });

  it("does not count the line sep= in the row of a month that is not a month", () => {
    const csv = ["sep=;", "Month;Revenue", "2027-01;100", "Total;100"].join("\n");

    expect(pageError(csv)).toBe(
      "Invalid actuals month: Total (row 3). If it is a total row, remove it.",
    );
  });

  it("keeps the old messages for a file without a table", () => {
    expect(pageError("Month,Notes\n2027-01,hello")).toBe(
      "Actuals CSV must contain Month/Period and at least one financial metric column.",
    );

    expect(pageError("Month,Revenue")).toBe("Actuals CSV contains no data rows.");
  });
});
