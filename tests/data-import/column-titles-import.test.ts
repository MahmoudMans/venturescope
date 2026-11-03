import { describe, expect, it } from "vitest";

import { DATA_IMPORT_TEMPLATE } from "@/lib/data-import/catalog";
import { validateDataImportCsv } from "@/lib/data-import/validation";

const E_ACUTE = String.fromCharCode(0xe9);

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

describe("an Actuals file with titles written the way people write them", () => {
  it("reads capitals and spaces, and does not lose the numbers any more", () => {
    const result = validate("ACTUALS", "Period,Revenue,Operating Expenses\n2027-01,1000,400");

    expect(result.issues).toEqual([]);

    const row = result.rows[0];

    expect(row.kind === "ACTUALS" ? [row.revenue, row.operatingExpenses] : []).toEqual([1000, 400]);

    expect(result.renamedColumns).toEqual([
      { title: "Operating Expenses", field: "operatingExpenses" },
    ]);
  });

  it("reads the title Revenue with a capital letter, which was dropped in silence before", () => {
    const result = validate("ACTUALS", "period,Revenue\n2027-01,1000");

    expect(result.rows).toHaveLength(1);

    const row = result.rows[0];

    expect(row.kind === "ACTUALS" ? row.revenue : null).toBe(1000);

    expect(result.ignoredColumns).toEqual([]);

    expect(result.renamedColumns).toEqual([]);
  });

  it("reads a French file from Excel with semicolons, decimal commas and French titles", () => {
    const csv = [
      `Mois;Chiffre d'affaires;Charges d'exploitation;Tr${E_ACUTE}sorerie;Clients`,
      "janv.-27;1250,50;300;5;12",
      `f${E_ACUTE}vr.-27;1300;310;6;13`,
    ].join("\r\n");

    const result = validate("ACTUALS", csv);

    expect(result.issues).toEqual([]);

    expect(result.rows).toHaveLength(2);

    const row = result.rows[0];

    expect(
      row.kind === "ACTUALS"
        ? [row.periodKey, row.revenue, row.operatingExpenses, row.cashBalance, row.customers]
        : [],
    ).toEqual(["2027-01", 1250.5, 300, 5, 12]);

    expect(result.renamedColumns).toEqual([
      { title: "Mois", field: "period" },
      { title: "Chiffre d'affaires", field: "revenue" },
      { title: "Charges d'exploitation", field: "operatingExpenses" },
      { title: `Tr${E_ACUTE}sorerie`, field: "cashBalance" },
      { title: "Clients", field: "customers" },
    ]);

    expect(result.ignoredColumns).toEqual([]);
  });

  it("shows the preview and the headers under the names of the fields", () => {
    const result = validate("ACTUALS", "Mois;CA\njanv.-27;1250,50");

    expect(result.headers).toEqual(["period", "revenue"]);

    expect(result.preview).toEqual([{ period: "janv.-27", revenue: "1250,50" }]);
  });

  it("lists a column that is not used and keeps it in the preview", () => {
    const result = validate("ACTUALS", "period,revenue,Notes\n2027-01,1000,hello");

    expect(result.issues).toEqual([]);

    expect(result.ignoredColumns).toEqual(["Notes"]);

    expect(result.renamedColumns).toEqual([]);

    expect(result.headers).toEqual(["period", "revenue", "Notes"]);

    expect(result.preview).toEqual([{ period: "2027-01", revenue: "1000", Notes: "hello" }]);
  });

  it("uses period and not Month when a file has both, and says Month is not used", () => {
    const result = validate("ACTUALS", "Month,period,revenue\nJan,2027-03,100");

    expect(result.issues).toEqual([]);

    expect(result.rows.map((row) => row.periodKey)).toEqual(["2027-03"]);

    expect(result.ignoredColumns).toEqual(["Month"]);
  });

  it("keeps the files of the template as they were", () => {
    for (const type of ["ACTUALS", "KPI_TARGETS", "VARIANCE_COMMENTARY"] as const) {
      const result = validate(type, DATA_IMPORT_TEMPLATE[type]);

      expect(result.issues, type).toEqual([]);

      expect(result.rows.length, type).toBeGreaterThan(0);

      expect(result.renamedColumns, type).toEqual([]);

      expect(result.ignoredColumns, type).toEqual([]);

      expect(result.headers, type).toEqual(DATA_IMPORT_TEMPLATE[type].split("\n")[0].split(","));
    }
  });
});

describe("a file whose titles cannot be read", () => {
  it("tells which title is missing and which other titles are read", () => {
    expect(errorOf("ACTUALS", "Foo,revenue\n1,2")).toBe(
      "Missing required CSV headers: period. Other titles that are read: period = month, date, mois, periode.",
    );

    expect(errorOf("KPI_TARGETS", "periodKey,metricCode\n2027-01,REVENUE")).toBe(
      "Missing required CSV headers: targetValue. Other titles that are read: targetValue = target, objectif, cible, valeurcible, valeurobjectif.",
    );
  });

  it("refuses two columns that are the same field", () => {
    expect(errorOf("ACTUALS", "period,Period,revenue\n2027-01,2027-01,1")).toBe(
      'Two columns are read as "period": "period" and "Period". Keep only one of them.',
    );
  });

  it("refuses an Actuals file that has no column with numbers", () => {
    expect(errorOf("ACTUALS", "period,foo\n2027-01,1")).toBe(
      "No column with numbers was found. Use at least one of these titles: revenue, cogs, operatingExpenses, ebitda, netIncome, cashFlow, cashBalance, mrr, customers.",
    );
  });

  it("asks for the month first when both the month and the numbers are missing", () => {
    expect(errorOf("ACTUALS", "foo,bar\n1,2")).toContain("Missing required CSV headers: period.");
  });

  it("still refuses duplicate titles and empty titles as before", () => {
    expect(errorOf("ACTUALS", "period,period,revenue\n2027-01,2027-01,1")).toBe(
      "CSV contains duplicate headers.",
    );

    expect(errorOf("ACTUALS", "period,,revenue\n2027-01,x,1")).toBe(
      "CSV contains an empty header.",
    );
  });
});

describe("a KPI targets file and a variance file with other titles", () => {
  it("reads English and French titles of a KPI targets file", () => {
    const csv = [
      "Mois;Indicateur;Objectif;Responsable;Commentaire",
      "01/01/2027;EBITDA_MARGIN;20,5;Sami;Monthly goal",
    ].join("\n");

    const result = validate("KPI_TARGETS", csv);

    expect(result.issues).toEqual([]);

    const row = result.rows[0];

    expect(
      row.kind === "KPI_TARGETS"
        ? [row.periodKey, row.metricCode, row.targetValue, row.ownerName, row.note]
        : [],
    ).toEqual(["2027-01", "EBITDA_MARGIN", 0.205, "Sami", "Monthly goal"]);

    expect(result.renamedColumns.map((item) => item.field)).toEqual([
      "periodKey",
      "metricCode",
      "targetValue",
      "ownerName",
      "note",
    ]);
  });

  it("reads the titles of a KPI targets file that was typed in Excel", () => {
    const result = validate(
      "KPI_TARGETS",
      "Period Key,Metric Code,Target Value\n2027-01,REVENUE,100",
    );

    expect(result.issues).toEqual([]);

    expect(result.rows).toHaveLength(1);
  });

  it("reads the titles of a variance file", () => {
    const csv = [
      "Period,KPI,Cause,Nature,Explication,Action,Owner,Recovery Month,Statut",
      "2027-01,REVENUE,VOLUME,RECURRING,Sales fell,Call clients,Sami,2027-03,MONITORING",
    ].join("\n");

    const result = validate("VARIANCE_COMMENTARY", csv);

    expect(result.issues).toEqual([]);

    const row = result.rows[0];

    expect(
      row.kind === "VARIANCE_COMMENTARY"
        ? [
            row.periodKey,
            row.metricCode,
            row.causeCode,
            row.varianceNature,
            row.explanation,
            row.correctiveAction,
            row.ownerName,
            row.recoveryPeriodKey,
            row.status,
          ]
        : [],
    ).toEqual([
      "2027-01",
      "REVENUE",
      "VOLUME",
      "RECURRING",
      "Sales fell",
      "Call clients",
      "Sami",
      "2027-03",
      "MONITORING",
    ]);
  });

  it("names the columns that are not used in a variance file", () => {
    const csv = [
      "periodKey,metricCode,causeCode,varianceNature,explanation,status,Priority",
      "2027-01,REVENUE,VOLUME,RECURRING,Sales fell,MONITORING,High",
    ].join("\n");

    expect(validate("VARIANCE_COMMENTARY", csv).ignoredColumns).toEqual(["Priority"]);
  });
});
