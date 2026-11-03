import { describe, expect, it } from "vitest";

import { DATA_IMPORT_TEMPLATE } from "@/lib/data-import/catalog";
import { countUntitled, describeUntitled, readCsvTable, titleRules } from "@/lib/data-import/table";
import { validateDataImportCsv } from "@/lib/data-import/validation";
import { actualPeriodKey, parseActualsCsv } from "@/lib/finance/actuals";

const ACTUALS = titleRules("ACTUALS", ["period"]);

type ImportType = "ACTUALS" | "KPI_TARGETS" | "VARIANCE_COMMENTARY";

const ONE_VALUE =
  "This row has 1 value in a column with no title. Add a title for it, or delete it. If it belongs to a text, put the whole text in quotes.";

const TWO_VALUES =
  "This row has 2 values in columns with no title. Add titles for them, or delete them. If they belong to a text, put the whole text in quotes.";

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

function pageError(csv: string): string {
  try {
    parseActualsCsv(csv);
  } catch (cause) {
    return cause instanceof Error ? cause.message : "not an error";
  }

  return "no error";
}

function pageRows(csv: string) {
  return parseActualsCsv(csv).map((row) => [actualPeriodKey(row.period), row.revenue]);
}

function issueList(importType: ImportType, csv: string) {
  return validate(importType, csv).issues.map((issue) => `${issue.row}:${issue.field}`);
}

describe("counting the values that have no title", () => {
  it("counts a value after the last title", () => {
    expect(countUntitled(["period", "revenue"], ["2027-01", "100", "40"])).toBe(1);
  });

  it("counts a value under an empty title", () => {
    expect(countUntitled(["period", "revenue", ""], ["2027-01", "100", "note"])).toBe(1);
  });

  it("counts each such value", () => {
    expect(countUntitled(["a"], ["1", "2", "3"])).toBe(2);

    expect(countUntitled([], ["1", "2"])).toBe(2);
  });

  it("does not count empty cells, cells with spaces, or a short row", () => {
    expect(countUntitled(["a", "b"], ["1", "2", "", "  "])).toBe(0);

    expect(countUntitled(["a", "b", "c"], ["1"])).toBe(0);

    expect(countUntitled([], [])).toBe(0);

    expect(countUntitled([], [""])).toBe(0);
  });

  it("does not count a value that stands under a title", () => {
    expect(countUntitled(["a", "b"], ["1", "2"])).toBe(0);
  });

  it("takes a title of spaces for an empty title", () => {
    expect(countUntitled(["a", "  "], ["1", "2"])).toBe(1);
  });

  it("counts a value by its column, also when an empty column stands before it", () => {
    expect(countUntitled(["a", "", "c"], ["1", "", "3"])).toBe(0);

    expect(countUntitled(["a", "", "c"], ["1", "", "3", "4"])).toBe(1);
  });
});

describe("the sentence about values that have no title", () => {
  it("is written for one value", () => {
    expect(describeUntitled(1)).toBe(ONE_VALUE);
  });

  it("is written for more values", () => {
    expect(describeUntitled(2)).toBe(TWO_VALUES);

    expect(describeUntitled(5)).toBe(
      "This row has 5 values in columns with no title. Add titles for them, or delete them. If they belong to a text, put the whole text in quotes.",
    );
  });
});

describe("reading a file as a table", () => {
  it("counts the values that have no title for each record, and keeps the records as before", () => {
    const csv = "period,revenue\n2027-01,100,40\n2027-02,110\n2027-03,120,1,2";

    const table = readCsvTable(csv, ACTUALS);

    expect(table.untitled).toEqual([1, 0, 2]);

    expect(table.records).toEqual([
      { period: "2027-01", revenue: "100" },
      { period: "2027-02", revenue: "110" },
      { period: "2027-03", revenue: "120" },
    ]);
  });

  it("gives zero for a file where every row fits the titles", () => {
    const table = readCsvTable("period,revenue\n2027-01,100\n2027-02,110", ACTUALS);

    expect(table.untitled).toEqual([0, 0]);
  });

  it("gives zero for the empty cells that Excel keeps at the end of the rows", () => {
    const table = readCsvTable("period;revenue\n2027-01;100;;\n2027-02;110;", ACTUALS);

    expect(table.untitled).toEqual([0, 0]);
  });

  it("counts below lines above the titles, and keeps the row numbers", () => {
    const csv = ["Report", "", "period,revenue", "2027-01,100", "2027-02,110,9"].join("\n");

    const table = readCsvTable(csv, ACTUALS);

    expect(table.untitled).toEqual([0, 1]);

    expect(table.rowNumbers).toEqual([4, 5]);
  });

  it("counts a value by its column in the file, also when an empty column was left out", () => {
    const table = readCsvTable("period;;revenue\n2027-01;;100;5\n2027-02;;110", ACTUALS);

    expect(table.headers).toEqual(["period", "revenue"]);

    expect(table.emptyColumns).toBe(1);

    expect(table.untitled).toEqual([1, 0]);
  });

  it("has one number for each record", () => {
    const table = readCsvTable("period,revenue\n2027-01,1\n\n2027-02,2,3\n", ACTUALS);

    expect(table.untitled.length).toBe(table.records.length);
  });
});

describe("the Data Import Center and a value that has no title", () => {
  it("names the row and says what to do", () => {
    expect(validate("ACTUALS", "period,revenue\n2027-01,100,40").issues).toEqual([
      { row: 2, field: "no title", message: ONE_VALUE },
    ]);
  });

  it("does not import such a row, and keeps the other rows", () => {
    const result = validate("ACTUALS", "period,revenue\n2027-01,100\n2027-02,110,45\n2027-03,120");

    expect(result.issues.map((issue) => issue.row)).toEqual([3]);

    expect(result.rows.map((row) => row.rowNumber)).toEqual([2, 4]);

    expect(result.rowCount).toBe(3);
  });

  it("names two values in one row together", () => {
    expect(validate("ACTUALS", "period,revenue\n2027-01,100,40,41").issues).toEqual([
      { row: 2, field: "no title", message: TWO_VALUES },
    ]);
  });

  it("names the row as the sheet counts it, below title lines and an empty row", () => {
    const csv = ["Report", "", "period,revenue", "2027-01,100", "", "2027-02,110,9"].join("\n");

    expect(issueList("ACTUALS", csv)).toEqual(["6:no title"]);
  });

  it("does not count the line sep= as a row", () => {
    const csv = ["sep=;", "period;revenue", "2027-01;100;5"].join("\n");

    expect(issueList("ACTUALS", csv)).toEqual(["2:no title"]);
  });

  it("names every row that has such a value", () => {
    const csv = "period,revenue\n2027-01,100,1\n2027-02,110,2\n2027-03,120,3";

    const result = validate("ACTUALS", csv);

    expect(result.issues.map((issue) => issue.row)).toEqual([2, 3, 4]);

    expect(result.rows).toEqual([]);
  });

  it("works for a KPI file", () => {
    const csv = "periodKey,metricCode,targetValue\n2027-01,REVENUE,100,note";

    expect(issueList("KPI_TARGETS", csv)).toEqual(["2:no title"]);
  });

  it("helps when a comma inside a text shifts the columns of a variance file", () => {
    const csv = [
      "periodKey,metricCode,causeCode,varianceNature,explanation,status",
      "2027-01,REVENUE,VOLUME,RECURRING,Pipeline fell short, again,MONITORING",
    ].join("\n");

    expect(issueList("VARIANCE_COMMENTARY", csv)).toEqual(["2:no title", "2:status"]);
  });

  it("reads the same text without a problem when it is in quotes", () => {
    const csv = [
      "periodKey,metricCode,causeCode,varianceNature,explanation,status",
      '2027-01,REVENUE,VOLUME,RECURRING,"Pipeline fell short, again",MONITORING',
    ].join("\n");

    const result = validate("VARIANCE_COMMENTARY", csv);

    expect(result.issues).toEqual([]);

    const row = result.rows[0];

    expect(row.kind === "VARIANCE_COMMENTARY" ? row.explanation : "").toBe(
      "Pipeline fell short, again",
    );
  });

  it("has no problem with marks at the end of a row that hold nothing", () => {
    const result = validate("ACTUALS", "period,revenue\n2027-01,100,,\n2027-02,110,");

    expect(result.issues).toEqual([]);

    expect(result.rows).toHaveLength(2);
  });

  it("still refuses a column with a value and an empty title for the whole file", () => {
    expect(errorOf("ACTUALS", "period,revenue,\n2027-01,100,note")).toBe(
      "CSV contains an empty header.",
    );
  });

  it("has no problem with the three templates", () => {
    for (const type of ["ACTUALS", "KPI_TARGETS", "VARIANCE_COMMENTARY"] as const) {
      expect(validate(type, DATA_IMPORT_TEMPLATE[type]).issues, type).toEqual([]);
    }
  });
});

describe("the Actuals page and a value that has no title", () => {
  it("names the row and says what to do", () => {
    expect(pageError("Month,Revenue\n2027-01,100,40")).toBe(`Row 2: ${ONE_VALUE}`);
  });

  it("names two values in one row together", () => {
    expect(pageError("Month,Revenue\n2027-01,100\n2027-02,110,1,2")).toBe(`Row 3: ${TWO_VALUES}`);
  });

  it("names the row as the sheet counts it, below title lines", () => {
    const csv = ["Report", "", "Month,Revenue", "2027-01,100", "2027-02,110,9"].join("\n");

    expect(pageError(csv)).toBe(`Row 5: ${ONE_VALUE}`);
  });

  it("names a value under an empty title", () => {
    expect(pageError("Month,Revenue,\n2027-01,100,note")).toBe(`Row 2: ${ONE_VALUE}`);
  });

  it("does not count the line sep= as a row", () => {
    expect(pageError("sep=;\nMonth;Revenue\n2027-01;100;5")).toBe(`Row 2: ${ONE_VALUE}`);
  });

  it("has no problem with marks at the end of a row that hold nothing", () => {
    expect(pageRows("Month,Revenue,,\n2027-01,100,,\n2027-02,110,")).toEqual([
      ["2027-01", 100],
      ["2027-02", 110],
    ]);
  });

  it("says first that a month is not a month", () => {
    expect(pageError("Month,Revenue\n2027-01,100\nTotal,100,5")).toBe(
      "Invalid actuals month: Total (row 3). If it is a total row, remove it.",
    );
  });
});

describe("a row that has values and no month on the Actuals page", () => {
  const NO_MONTH = "This row has values but no month. Add the month, or delete the row.";

  it("is refused with its row", () => {
    expect(pageError("Month,Revenue\n2027-01,100\n,50\n2027-03,70")).toBe(`Row 3: ${NO_MONTH}`);
  });

  it("is refused when the month cell holds only spaces", () => {
    expect(pageError("Month,Revenue\n2027-01,100\n   ,50")).toBe(`Row 3: ${NO_MONTH}`);
  });

  it("is refused at the bottom, as a total row without a name", () => {
    expect(pageError("Month,Revenue\n2027-01,100\n2027-02,110\n,210")).toBe(`Row 4: ${NO_MONTH}`);
  });

  it("is refused with the row of the sheet, below title lines and an empty row", () => {
    const csv = ["Report", "", "Month,Revenue", "2027-01,100", "", ",5"].join("\n");

    expect(pageError(csv)).toBe(`Row 6: ${NO_MONTH}`);
  });

  it("is refused also when the value is in a column that is not read", () => {
    expect(pageError("Month,Revenue,Notes\n2027-01,100,a\n,,remember this")).toBe(
      `Row 3: ${NO_MONTH}`,
    );
  });

  it("does not stop a file with an empty line or a line of marks only", () => {
    expect(pageRows("Month,Revenue\n2027-01,100\n\n,\n2027-03,70")).toEqual([
      ["2027-01", 100],
      ["2027-03", 70],
    ]);
  });
});

describe("the two screens agree", () => {
  it("both refuse or both accept the same file", () => {
    const files = [
      "Month,Revenue\n2027-01,100\n2027-02,110",
      "Month,Revenue\n2027-01,100,40",
      "Month,Revenue\n2027-01,100\n,50",
      "Month,Revenue\n2027-01,100\n\n,\n2027-03,70",
      "Report\n\nMonth,Revenue\n2027-01,100\n2027-02,110,9",
      "Month,Revenue,\n2027-01,100,note",
      "Month,Revenue,,\n2027-01,100,,",
      "sep=;\nMonth;Revenue\n2027-01;100;5",
    ];

    for (const file of files) {
      const importRefuses =
        errorOf("ACTUALS", file) !== "no error" || validate("ACTUALS", file).issues.length > 0;

      const pageRefuses = pageError(file) !== "no error";

      expect(pageRefuses, file).toBe(importRefuses);
    }
  });
});
