import { describe, expect, it } from "vitest";

import { validateDataImportCsv } from "@/lib/data-import/validation";

function actuals(csv: string) {
  const result = validateDataImportCsv({ importType: "ACTUALS", csv });

  return {
    result,
    months: result.rows.map((row) => row.periodKey),
    lines: result.issues.map((issue) => `${issue.row}|${issue.field}|${issue.message}`),
  };
}

describe("an Actuals file with the months that Excel writes", () => {
  it("reads Jan-27 in a file with commas", () => {
    const { result, months } = actuals("period,revenue\nJan-27,1000\nFeb-27,1100\nMar-27,1200");

    expect(result.issues).toEqual([]);

    expect(months).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("reads janv.-27 in a file with semicolons and decimal commas", () => {
    const { result, months } = actuals("period;revenue\njanv.-27;1250,50\nmars-27;1300,00");

    expect(result.issues).toEqual([]);

    expect(months).toEqual(["2027-01", "2027-03"]);
  });

  it("reads dates with the day first in a file with semicolons", () => {
    const { result, months } = actuals(
      "period;revenue\n01/01/2027;1250,50\n01/02/2027;1300,00\n01/03/2027;5",
    );

    expect(result.issues).toEqual([]);

    expect(months).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("reads dates with the month first in a file with commas", () => {
    const { result, months } = actuals(
      "period,revenue\n1/1/2027,1000\n2/1/2027,1100\n3/1/2027,1200",
    );

    expect(result.issues).toEqual([]);

    expect(months).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("reads dates of the last day of the month and dates with dots", () => {
    expect(actuals("period,revenue\n31/01/2027,1000\n28/02/2027,1100").months).toEqual([
      "2027-01",
      "2027-02",
    ]);

    expect(actuals("period;revenue\n01.01.2027;1.250,50\n01.02.2027;5").months).toEqual([
      "2027-01",
      "2027-02",
    ]);
  });

  it("shows the text of the file in the preview, as it is", () => {
    const { result } = actuals("period;revenue\n01/01/2027;1250,50\n01/02/2027;5");

    expect(result.preview.map((row) => row.period)).toEqual(["01/01/2027", "01/02/2027"]);
  });

  it("gives a duplicate issue when two dates are the same month", () => {
    const { result, lines } = actuals("period,revenue\n01/01/2027,1000\n15/01/2027,1100");

    expect(lines).toEqual(["3|duplicate|Duplicate import key: 2027-01."]);

    expect(result.rows).toEqual([]);
  });

  it("keeps the number problems of the same file", () => {
    const { lines } = actuals("period;revenue\n01/01/2027;1.250\n01/02/2027;5");

    expect(lines).toHaveLength(1);

    expect(lines[0]).toContain('2|revenue|"1.250" is not clear');
  });

  it("keeps a month of the normal form as before", () => {
    const { result, months } = actuals("period,revenue\n2027-01,1000\n2027-02,1100");

    expect(result.issues).toEqual([]);

    expect(months).toEqual(["2027-01", "2027-02"]);
  });
});

describe("an Actuals file with a date that is not clear", () => {
  it("gives one issue that tells how to write the month, and the row is not used", () => {
    const { result, lines } = actuals("period,revenue\n03/04/2027,1000");

    expect(lines).toEqual([
      '2|period|"03/04/2027" is not clear. Write 2027-04 if it is 3 April, or 2027-03 if it is 4 March.',
      "2|period|period must be a valid month.",
    ]);

    expect(result.rows).toEqual([]);
  });

  it("names the row of the first date that is not clear", () => {
    const { lines } = actuals("period,revenue\n2027-01,1\n2027-02,2\n02/03/2027,3");

    expect(lines[0]).toContain("4|period|");

    expect(lines[0]).toContain('"02/03/2027" is not clear');
  });

  it("gives an issue when the dates use both orders", () => {
    const { lines } = actuals("period,revenue\n31/01/2027,1000\n02/28/2027,1100");

    expect(lines[0]).toBe(
      "3|period|The dates in this column are written in two different orders (day first and month first), so they cannot be read. Write each month as 2027-01.",
    );
  });
});

describe("a KPI targets file and a variance file with dates", () => {
  it("reads the dates of a KPI file with semicolons", () => {
    const csv = [
      "periodKey;metricCode;targetValue",
      "01/01/2027;EBITDA_MARGIN;20,5",
      "01/01/2027;REVENUE;120 000,50",
      "01/02/2027;EBITDA_MARGIN;21,5",
    ].join("\n");

    const result = validateDataImportCsv({ importType: "KPI_TARGETS", csv });

    expect(result.issues).toEqual([]);

    expect(result.rows.map((row) => row.periodKey)).toEqual(["2027-01", "2027-01", "2027-02"]);
  });

  it("does not use the rule that no month repeats for a KPI file with commas", () => {
    const csv = [
      "periodKey,metricCode,targetValue",
      "2/1/2027,EBITDA_MARGIN,20%",
      "3/1/2027,EBITDA_MARGIN,21%",
    ].join("\n");

    const result = validateDataImportCsv({ importType: "KPI_TARGETS", csv });

    expect(result.issues[0]).toEqual({
      row: 2,
      field: "periodKey",
      message:
        '"2/1/2027" is not clear. Write 2027-01 if it is 2 January, or 2027-02 if it is 1 February.',
    });

    expect(result.rows).toEqual([]);
  });

  it("reads a KPI file with commas when a date shows the order", () => {
    const csv = [
      "periodKey,metricCode,targetValue",
      "31/01/2027,EBITDA_MARGIN,20%",
      "01/02/2027,EBITDA_MARGIN,21%",
    ].join("\n");

    const result = validateDataImportCsv({ importType: "KPI_TARGETS", csv });

    expect(result.issues).toEqual([]);

    expect(result.rows.map((row) => row.periodKey)).toEqual(["2027-01", "2027-02"]);
  });

  it("reads the date of a variance file", () => {
    const csv = [
      "periodKey;metricCode;causeCode;varianceNature;explanation;status",
      "31/01/2027;REVENUE;VOLUME;RECURRING;Sales fell 1,250 units;MONITORING",
    ].join("\n");

    const result = validateDataImportCsv({ importType: "VARIANCE_COMMENTARY", csv });

    expect(result.issues).toEqual([]);

    expect(result.rows[0].periodKey).toBe("2027-01");
  });

  it("reads a month name in a variance file", () => {
    const csv = [
      "periodKey,metricCode,causeCode,varianceNature,explanation,status",
      "Jan-27,REVENUE,VOLUME,RECURRING,Sales fell,MONITORING",
    ].join("\n");

    const result = validateDataImportCsv({ importType: "VARIANCE_COMMENTARY", csv });

    expect(result.issues).toEqual([]);

    expect(result.rows[0].periodKey).toBe("2027-01");
  });
});
