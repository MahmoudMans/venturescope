import { describe, expect, it } from "vitest";

import { DATA_IMPORT_TEMPLATE } from "@/lib/data-import/catalog";
import { validateDataImportCsv } from "@/lib/data-import/validation";

const E_ACUTE = String.fromCharCode(0xe9);

type ImportType = "ACTUALS" | "KPI_TARGETS" | "VARIANCE_COMMENTARY";

function validate(importType: ImportType, csv: string) {
  return validateDataImportCsv({ importType, csv });
}

const KPI_HEAD = "periodKey,metricCode,targetValue";

const VARIANCE_HEAD = "periodKey,metricCode,causeCode,varianceNature,explanation,status";

const KPI_LIST =
  "REVENUE, EBITDA_MARGIN, CASH_BALANCE, MRR, CUSTOMERS, RUNWAY_MONTHS, FORECAST_ACCURACY";

describe("a KPI targets file with the KPI written as a name", () => {
  it("reads the codes in small letters or with a capital letter, and tells nothing", () => {
    const csv = [KPI_HEAD, "2027-01,revenue,100", "2027-01,Mrr,5", "2027-01,Cash Balance,7"].join(
      "\n",
    );

    const result = validate("KPI_TARGETS", csv);

    expect(result.issues).toEqual([]);

    expect(result.rows.map((row) => (row.kind === "KPI_TARGETS" ? row.metricCode : ""))).toEqual([
      "REVENUE",
      "MRR",
      "CASH_BALANCE",
    ]);

    expect(result.readValues).toEqual([
      { field: "metricCode", text: "Cash Balance", code: "CASH_BALANCE" },
    ]);
  });

  it("reads English and French names, and lists each text that was read", () => {
    const csv = [
      KPI_HEAD,
      "2027-01,EBITDA margin,20",
      "2027-01,Chiffre d'affaires,1000",
      `2027-01,Tr${E_ACUTE}sorerie,500`,
      "2027-02,Chiffre d'affaires,1100",
    ].join("\n");

    const result = validate("KPI_TARGETS", csv);

    expect(result.issues).toEqual([]);

    expect(result.rows).toHaveLength(4);

    expect(result.readValues).toEqual([
      { field: "metricCode", text: "EBITDA margin", code: "EBITDA_MARGIN" },
      { field: "metricCode", text: "Chiffre d'affaires", code: "REVENUE" },
      { field: "metricCode", text: `Tr${E_ACUTE}sorerie`, code: "CASH_BALANCE" },
    ]);
  });

  it("reads a whole French file from Excel and keeps the text of the file in the preview", () => {
    const csv = [
      "Mois;Indicateur;Objectif;Responsable",
      "janv.-27;Marge EBITDA;20,5;Sami",
      "janv.-27;Clients actifs;120;Sami",
    ].join("\r\n");

    const result = validate("KPI_TARGETS", csv);

    expect(result.issues).toEqual([]);

    const first = result.rows[0];

    expect(
      first.kind === "KPI_TARGETS" ? [first.periodKey, first.metricCode, first.targetValue] : [],
    ).toEqual(["2027-01", "EBITDA_MARGIN", 0.205]);

    const second = result.rows[1];

    expect(second.kind === "KPI_TARGETS" ? second.metricCode : "").toBe("CUSTOMERS");

    expect(result.preview[0]).toEqual({
      periodKey: "janv.-27",
      metricCode: "Marge EBITDA",
      targetValue: "20,5",
      ownerName: "Sami",
    });
  });

  it("sees that two names of one KPI in one month are the same row", () => {
    const csv = [KPI_HEAD, "2027-01,REVENUE,100", "2027-01,Chiffre d'affaires,200"].join("\n");

    const result = validate("KPI_TARGETS", csv);

    expect(result.issues).toEqual([
      { row: 3, field: "duplicate", message: "Duplicate import key: 2027-01:REVENUE." },
    ]);

    expect(result.rows).toEqual([]);
  });

  it("refuses a KPI that is no name, and tells the codes that can be used", () => {
    const result = validate("KPI_TARGETS", [KPI_HEAD, "2027-01,Revnue,100"].join("\n"));

    expect(result.issues).toEqual([
      { row: 2, field: "metricCode", message: `Invalid KPI metric. Use one of: ${KPI_LIST}.` },
    ]);

    expect(result.rows).toEqual([]);

    expect(result.readValues).toEqual([]);
  });

  it("refuses an empty KPI in the same way, on the right row", () => {
    const csv = [KPI_HEAD, "2027-01,REVENUE,100", "2027-01,,100"].join("\n");

    expect(validate("KPI_TARGETS", csv).issues).toEqual([
      { row: 3, field: "metricCode", message: `Invalid KPI metric. Use one of: ${KPI_LIST}.` },
    ]);
  });

  it("does not take EBITDA for the margin", () => {
    const issues = validate("KPI_TARGETS", [KPI_HEAD, "2027-01,EBITDA,100"].join("\n")).issues;

    expect(issues.map((issue) => issue.message)).toEqual([
      `Invalid KPI metric. Use one of: ${KPI_LIST}.`,
    ]);
  });
});

describe("a variance file with names for the codes", () => {
  it("reads English names", () => {
    const csv = [
      VARIANCE_HEAD,
      "2027-01,Revenue,Volume,Recurring,Pipeline fell short,Monitoring",
      "2027-02,Cash flow,Working capital,Structural,Slow payments,Open",
    ].join("\n");

    const result = validate("VARIANCE_COMMENTARY", csv);

    expect(result.issues).toEqual([]);

    expect(result.rows).toHaveLength(2);

    const second = result.rows[1];

    expect(
      second.kind === "VARIANCE_COMMENTARY"
        ? [second.metricCode, second.causeCode, second.varianceNature, second.status]
        : [],
    ).toEqual(["CASH_FLOW", "WORKING_CAPITAL", "STRUCTURAL", "OPEN"]);

    expect(result.readValues).toEqual([
      { field: "metricCode", text: "Cash flow", code: "CASH_FLOW" },
      { field: "causeCode", text: "Working capital", code: "WORKING_CAPITAL" },
    ]);
  });

  it("reads French names in every code column", () => {
    const csv = [
      "Mois;Indicateur;Cause;Nature;Explication;Action;Statut",
      `janv.-27;Chiffre d'affaires;Prix;R${E_ACUTE}current;Les prix ont baiss${E_ACUTE};Revoir les tarifs;Suivi`,
    ].join("\r\n");

    const result = validate("VARIANCE_COMMENTARY", csv);

    expect(result.issues).toEqual([]);

    const row = result.rows[0];

    expect(
      row.kind === "VARIANCE_COMMENTARY"
        ? [row.metricCode, row.causeCode, row.varianceNature, row.status]
        : [],
    ).toEqual(["REVENUE", "PRICE", "RECURRING", "MONITORING"]);

    expect(result.readValues.map((item) => `${item.field}:${item.code}`)).toEqual([
      "metricCode:REVENUE",
      "causeCode:PRICE",
      "varianceNature:RECURRING",
      "status:MONITORING",
    ]);
  });

  it("tells a text that two columns share in each column", () => {
    const csv = [
      VARIANCE_HEAD,
      "2027-01,REVENUE,Exceptionnel,Exceptionnel,One time sale,Open",
    ].join("\n");

    const result = validate("VARIANCE_COMMENTARY", csv);

    expect(result.issues).toEqual([]);

    expect(result.readValues).toEqual([
      { field: "causeCode", text: "Exceptionnel", code: "ONE_OFF" },
      { field: "varianceNature", text: "Exceptionnel", code: "ONE_OFF" },
    ]);
  });

  it("tells the codes that can be used for every column that is wrong", () => {
    const csv = [VARIANCE_HEAD, "2027-01,Foo,Bar,Baz,Pipeline fell short,Qux"].join("\n");

    expect(validate("VARIANCE_COMMENTARY", csv).issues).toEqual([
      {
        row: 2,
        field: "metricCode",
        message:
          "Invalid variance metric. Use one of: REVENUE, COGS, OPERATING_EXPENSES, EBITDA, NET_INCOME, CASH_FLOW, CASH_BALANCE, MRR, CUSTOMERS.",
      },
      {
        row: 2,
        field: "causeCode",
        message:
          "Invalid variance root cause. Use one of: VOLUME, PRICE, MIX, TIMING, CHURN_RETENTION, INPUT_COST, HEADCOUNT, MARKETING, OTHER_OPEX, WORKING_CAPITAL, ONE_OFF, ACCOUNTING_CLASSIFICATION, OTHER.",
      },
      {
        row: 2,
        field: "varianceNature",
        message: "Invalid variance nature. Use one of: ONE_OFF, RECURRING, STRUCTURAL, UNKNOWN.",
      },
      {
        row: 2,
        field: "status",
        message:
          "Invalid variance review status. Use one of: OPEN, MONITORING, RESOLVED, ACCEPTED.",
      },
    ]);
  });

  it("leaves the other messages of the check as they were", () => {
    const csv = [VARIANCE_HEAD, "2027-01,REVENUE,VOLUME,RECURRING,no,MONITORING"].join("\n");

    expect(validate("VARIANCE_COMMENTARY", csv).issues).toEqual([
      {
        row: 2,
        field: "explanation",
        message: "explanation must contain between 5 and 2000 characters.",
      },
    ]);
  });
});

describe("files that hold no names to read", () => {
  it("tells nothing for the three templates", () => {
    for (const type of ["ACTUALS", "KPI_TARGETS", "VARIANCE_COMMENTARY"] as const) {
      const result = validate(type, DATA_IMPORT_TEMPLATE[type]);

      expect(result.issues, type).toEqual([]);

      expect(result.readValues, type).toEqual([]);
    }
  });

  it("does not read the cells of an Actuals file as names", () => {
    const result = validate("ACTUALS", "period,revenue,mrr\n2027-01,100,5\n2027-02,110,6");

    expect(result.issues).toEqual([]);

    expect(result.readValues).toEqual([]);

    expect(result.preview[0]).toEqual({ period: "2027-01", revenue: "100", mrr: "5" });
  });
});
