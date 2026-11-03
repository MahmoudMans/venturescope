import { describe, expect, it } from "vitest";

import { validateDataImportCsv } from "@/lib/data-import/validation";

const NBSP = String.fromCharCode(0xa0);

function actuals(csv: string) {
  const result = validateDataImportCsv({ importType: "ACTUALS", csv });

  const rows = result.rows.map((row) => {
    if (row.kind !== "ACTUALS") {
      throw new Error("not an Actuals row");
    }

    return row;
  });

  return { result, rows };
}

function targets(csv: string) {
  const result = validateDataImportCsv({ importType: "KPI_TARGETS", csv });

  const rows = result.rows.map((row) => {
    if (row.kind !== "KPI_TARGETS") {
      throw new Error("not a KPI row");
    }

    return row;
  });

  return { result, rows };
}

describe("an Actuals file saved by Excel with French settings", () => {
  const csv = [
    "period;revenue;cogs;cashBalance;customers",
    `2027-01;1${NBSP}250,50;300,25;(2 000,00);1 200`,
    "2027-02;1250,5;0,5;-100,00;10",
    "",
  ].join("\r\n");

  it("is read with its semicolons and its decimal commas", () => {
    const { result, rows } = actuals(csv);

    expect(result.issues).toEqual([]);

    expect(result.delimiter).toBe(";");

    expect(result.rowCount).toBe(2);

    expect(rows).toHaveLength(2);

    expect([rows[0].revenue, rows[0].cogs, rows[0].cashBalance, rows[0].customers]).toEqual([
      1250.5, 300.25, -2000, 1200,
    ]);

    expect([rows[1].revenue, rows[1].cogs, rows[1].cashBalance, rows[1].customers]).toEqual([
      1250.5, 0.5, -100, 10,
    ]);
  });

  it("shows the text of the file in the preview, as it is", () => {
    const { result } = actuals(csv);

    expect(result.headers).toEqual(["period", "revenue", "cogs", "cashBalance", "customers"]);

    expect(result.preview[0].revenue).toBe(`1${NBSP}250,50`);

    expect(result.preview[0].cashBalance).toBe("(2 000,00)");
  });

  it("is read the same way with a byte order mark", () => {
    const { result, rows } = actuals(`${String.fromCharCode(0xfeff)}${csv}`);

    expect(result.issues).toEqual([]);

    expect(rows[0].revenue).toBe(1250.5);
  });

  it("still tells the other problems of a row", () => {
    const { result } = actuals("period;revenue\n2027-13;1 250,50");

    expect(result.issues).toEqual([
      { row: 2, field: "period", message: "period must be a valid month." },
    ]);
  });

  it("does not read 1,250,000 in a file with semicolons", () => {
    const { result, rows } = actuals("period;revenue\n2027-01;1,250,000");

    expect(result.issues.map((issue) => `${issue.row} ${issue.field} ${issue.message}`)).toEqual([
      "2 revenue revenue must be a valid number.",
    ]);

    expect(rows).toHaveLength(0);
  });

  it("does not read a customer count with decimals", () => {
    const { result } = actuals("period;customers\n2027-01;10,5");

    expect(result.issues.map((issue) => issue.field)).toEqual(["customers"]);
  });
});

describe("a dot that is not clear in a file with semicolons", () => {
  it("is not read, so no number is wrong by a factor of 1000", () => {
    const { result, rows } = actuals("period;revenue;cogs\n2027-01;1.250;300");

    expect(result.issues).toHaveLength(1);

    expect(result.issues[0].row).toBe(2);

    expect(result.issues[0].field).toBe("revenue");

    expect(result.issues[0].message).toContain('"1.250" is not clear');

    expect(rows).toHaveLength(0);

    expect(result.rowCount).toBe(1);
  });

  it("is reported together with the other problems of the file", () => {
    const { result } = actuals("period;revenue\n2027-13;1.250\n2027-02;2.000");

    expect(result.issues.map((issue) => `${issue.row}:${issue.field}`)).toEqual([
      "2:revenue",
      "2:period",
      "3:revenue",
    ]);
  });

  it("is a normal decimal point in a file with commas", () => {
    const { result, rows } = actuals("period,revenue\n2027-01,1.250");

    expect(result.issues).toEqual([]);

    expect(rows[0].revenue).toBe(1.25);
  });
});

describe("a KPI targets file saved by Excel with French settings", () => {
  const csv = [
    "periodKey;metricCode;targetValue;ownerName;note",
    "2027-01;REVENUE;120 000,50;Finance;A note, with a comma",
    "2027-01;EBITDA_MARGIN;20,5;;",
    "",
  ].join("\n");

  it("is read with its decimal commas and keeps the comma of a note", () => {
    const { result, rows } = targets(csv);

    expect(result.issues).toEqual([]);

    expect(result.delimiter).toBe(";");

    expect(rows).toHaveLength(2);

    expect(rows[0].targetValue).toBe(120000.5);

    expect(rows[0].note).toBe("A note, with a comma");

    expect(rows[1].targetValue).toBeCloseTo(0.205, 10);

    expect(rows[1].ownerName).toBeNull();
  });
});

describe("a text column in a file with semicolons", () => {
  it("is never read as a number, even when it looks like one", () => {
    const csv = "periodKey;metricCode;targetValue;ownerName;note\n2027-01;REVENUE;5;1.250;(5)";

    const { result, rows } = targets(csv);

    expect(result.issues).toEqual([]);

    expect(rows[0].ownerName).toBe("1.250");

    expect(rows[0].note).toBe("(5)");
  });
});

describe("a variance commentary file saved by Excel with French settings", () => {
  it("keeps the numbers and the commas of a sentence as they are", () => {
    const csv = [
      "periodKey;metricCode;causeCode;varianceNature;explanation;status",
      "2027-01;REVENUE;VOLUME;RECURRING;Sales fell 1,250 units, below plan;MONITORING",
    ].join("\n");

    const result = validateDataImportCsv({
      importType: "VARIANCE_COMMENTARY",
      csv,
    });

    expect(result.issues).toEqual([]);

    const row = result.rows[0];

    expect(row.kind).toBe("VARIANCE_COMMENTARY");

    if (row.kind === "VARIANCE_COMMENTARY") {
      expect(row.explanation).toBe("Sales fell 1,250 units, below plan");
    }
  });
});

describe("a text file with tabs", () => {
  it("is read, and a decimal comma works", () => {
    const { result, rows } = actuals("period\trevenue\tcogs\n2027-01\t1250,50\t(300)\n");

    expect(result.issues).toEqual([]);

    expect(result.delimiter).toBe("\t");

    expect([rows[0].revenue, rows[0].cogs]).toEqual([1250.5, -300]);
  });
});

describe("a normal comma file", () => {
  it("is read as before", () => {
    const { result, rows } = actuals("period,revenue,cashBalance,customers\n2027-01,1000,5000,10");

    expect(result.issues).toEqual([]);

    expect(result.delimiter).toBe(",");

    expect([rows[0].revenue, rows[0].cashBalance, rows[0].customers]).toEqual([1000, 5000, 10]);
  });

  it("reads a number with thousands marks when it is in quotes", () => {
    const { result, rows } = actuals('period,revenue,cogs\n2027-01,"1,250.50","(1,200)"');

    expect(result.issues).toEqual([]);

    expect([rows[0].revenue, rows[0].cogs]).toEqual([1250.5, -1200]);
  });

  it("reads a percent sign in a KPI target", () => {
    const { result, rows } = targets("periodKey,metricCode,targetValue\n2027-01,EBITDA_MARGIN,20%");

    expect(result.issues).toEqual([]);

    expect(rows[0].targetValue).toBeCloseTo(0.2, 10);
  });

  it("still refuses a text that is not a number", () => {
    const { result } = actuals("period,revenue\n2027-01,abc");

    expect(result.issues.map((issue) => issue.message)).toEqual([
      "revenue must be a valid number.",
    ]);
  });
});
