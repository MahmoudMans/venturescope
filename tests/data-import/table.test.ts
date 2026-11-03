import { describe, expect, it } from "vitest";

import { parseCsvMatrix, parseCsvRows } from "@/lib/data-import/csv";
import {
  type CsvDelimiter,
  delimiterCandidates,
  readDeclaredDelimiter,
} from "@/lib/data-import/delimiter";
import { isNoNumber } from "@/lib/data-import/number";
import {
  describeLayout,
  dropSepLine,
  findTable,
  readCsvTable,
  titleRules,
} from "@/lib/data-import/table";

const BOM = String.fromCharCode(0xfeff);

const EN_DASH = String.fromCharCode(0x2013);

const EM_DASH = String.fromCharCode(0x2014);

const MINUS_SIGN = String.fromCharCode(0x2212);

const NON_BREAKING_HYPHEN = String.fromCharCode(0x2011);

const ACTUALS = titleRules("ACTUALS", ["period"]);

const KPI = titleRules("KPI_TARGETS", ["periodKey", "metricCode", "targetValue"]);

/** The message of the error that a call throws, or a note that nothing was thrown. */
function message(run: () => unknown): string {
  try {
    run();
  } catch (cause) {
    return cause instanceof Error ? cause.message : "not an error";
  }

  return "no error";
}

describe("the mark that a first line declares", () => {
  it("reads sep= with a semicolon, a comma or a tab", () => {
    expect(readDeclaredDelimiter("sep=;\nperiod;revenue")).toBe(";");

    expect(readDeclaredDelimiter("sep=,\nperiod,revenue")).toBe(",");

    expect(readDeclaredDelimiter("sep=\t\nperiod\trevenue")).toBe("\t");
  });

  it("reads the line when it ends with Windows line breaks, spaces or the end of the file", () => {
    expect(readDeclaredDelimiter("sep=;\r\nperiod;revenue")).toBe(";");

    expect(readDeclaredDelimiter("sep=; \nperiod;revenue")).toBe(";");

    expect(readDeclaredDelimiter("sep=;")).toBe(";");
  });

  it("reads the line when the file starts with a byte order mark", () => {
    expect(readDeclaredDelimiter(`${BOM}sep=;\nperiod;revenue`)).toBe(";");
  });

  it("reads capital letters", () => {
    expect(readDeclaredDelimiter("SEP=;\nperiod;revenue")).toBe(";");
  });

  it("gives null for a file that does not declare a mark", () => {
    const files = [
      "period;revenue\n2027-01;100",
      "period,revenue",
      "",
      "sep=|\nperiod|revenue",
      "sep=;x\nperiod;revenue",
      "period;revenue\nsep=;\n2027-01;100",
      " sep=;\nperiod;revenue",
    ];

    for (const file of files) {
      expect(readDeclaredDelimiter(file), file).toBe(null);
    }
  });
});

describe("the marks to try for a file", () => {
  it("puts the mark that was counted first, then the others", () => {
    expect(delimiterCandidates("period;revenue\n2027-01;100")).toEqual([";", ",", "\t"]);

    expect(delimiterCandidates("period,revenue\n2027-01,100")).toEqual([",", ";", "\t"]);

    expect(delimiterCandidates("period\trevenue\n2027-01\t100")).toEqual(["\t", ",", ";"]);
  });

  it("puts the mark that sep= declares before the others", () => {
    expect(delimiterCandidates("sep=;\nperiod,revenue,cogs")).toEqual([";", ",", "\t"]);
  });

  it("puts the comma first for a first line without a mark", () => {
    expect(delimiterCandidates("Monthly report\nperiod;revenue")).toEqual([",", ";", "\t"]);
  });

  it("never gives a mark twice and always gives the three marks", () => {
    const files = ["", "a", "a,b", "a;b", "a\tb", "sep=;\na;b", "sep=,\na,b", "a,b;c\td"];

    for (const file of files) {
      const list = delimiterCandidates(file);

      expect(list.length, file).toBe(3);

      expect(new Set(list).size, file).toBe(3);

      expect(list.slice().sort(), file).toEqual(["\t", ",", ";"]);
    }
  });
});

describe("the rows of a file with their numbers", () => {
  it("numbers the rows from 1", () => {
    expect(parseCsvRows("a,b\n1,2\n3,4", ",")).toEqual([
      { row: 1, cells: ["a", "b"] },
      { row: 2, cells: ["1", "2"] },
      { row: 3, cells: ["3", "4"] },
    ]);
  });

  it("counts a blank row, so the numbers are the ones of the sheet", () => {
    expect(parseCsvRows("a,b\n\n1,2\n,\n3,4\n", ",").map((item) => item.row)).toEqual([1, 3, 5]);
  });

  it("counts Windows line breaks and old Mac line breaks once", () => {
    expect(parseCsvRows("a,b\r\n\r\n1,2", ",").map((item) => item.row)).toEqual([1, 3]);

    expect(parseCsvRows("a,b\r\r1,2", ",").map((item) => item.row)).toEqual([1, 3]);
  });

  it("counts a cell with a line break inside quotes as one row", () => {
    const rows = parseCsvRows('a,b\n"x\ny",2\n3,4', ",");

    expect(rows.map((item) => item.row)).toEqual([1, 2, 3]);

    expect(rows[1].cells).toEqual(["x\ny", "2"]);
  });

  it("gives the same cells as the matrix of before", () => {
    const text = 'a;b;c\n1;"x;y";3\n\n4;5;6';

    expect(parseCsvRows(text, ";").map((item) => item.cells)).toEqual(parseCsvMatrix(text, ";"));
  });

  it("still refuses a quote that is never closed", () => {
    expect(message(() => parseCsvRows('a,b\n"x,2', ","))).toBe(
      "CSV contains an unterminated quoted field.",
    );
  });
});

describe("the rules for the row of titles", () => {
  it("gives the full score to a row with a month and a column of numbers (Actuals)", () => {
    expect(ACTUALS.full).toBe(2);

    expect(ACTUALS.score(["Month", "Revenue"])).toBe(2);

    expect(ACTUALS.score(["Mois", "Chiffre d'affaires", "Notes"])).toBe(2);
  });

  it("gives less than the full score to a row that lacks a part (Actuals)", () => {
    expect(ACTUALS.score(["Month", "Notes"])).toBe(1);

    expect(ACTUALS.score(["Revenue", "COGS"])).toBe(1);

    expect(ACTUALS.score(["Monthly report 2027"])).toBe(0);

    expect(ACTUALS.score([])).toBe(0);
  });

  it("counts the titles that a KPI file needs", () => {
    expect(KPI.full).toBe(3);

    expect(KPI.score(["Mois", "Indicateur", "Objectif"])).toBe(3);

    expect(KPI.score(["periodKey", "metricCode"])).toBe(2);

    expect(KPI.score(["Company", "Acme"])).toBe(0);
  });

  it("gives the full score to a row where two columns are the same field", () => {
    expect(ACTUALS.score(["Month", "Period", "Revenue"])).toBe(2);
  });

  it("does not take a data row for the titles", () => {
    expect(ACTUALS.score(["2027-01", "1000", "300"])).toBe(0);
  });
});

describe("finding the mark and the row of titles together", () => {
  function tryMarks(input: string) {
    const tried: CsvDelimiter[] = [];

    const found = findTable(
      input,
      (delimiter) => {
        tried.push(delimiter);

        return parseCsvMatrix(input, delimiter);
      },
      { score: (row) => ACTUALS.score(row), full: ACTUALS.full },
    );

    return { found, tried };
  }

  it("takes the first mark when the titles are found with it", () => {
    const { found, tried } = tryMarks("period,revenue\n2027-01,100");

    expect(found.delimiter).toBe(",");

    expect(found.index).toBe(0);

    expect(found.complete).toBe(true);

    expect(tried).toEqual([","]);
  });

  it("goes to the next mark when a title line without marks stands above a semicolon file", () => {
    const { found, tried } = tryMarks("Monthly report\nperiod;revenue\n2027-01;100");

    expect(found.delimiter).toBe(";");

    expect(found.index).toBe(1);

    expect(found.complete).toBe(true);

    expect(tried).toEqual([",", ";"]);
  });

  it("finds the titles under many lines", () => {
    const lines = ["Report", "Company: Acme", "Year: 2027", "", "period,revenue", "2027-01,100"];

    const { found } = tryMarks(lines.join("\n"));

    expect(found.index).toBe(3);

    expect(found.complete).toBe(true);
  });

  it("takes the row with the most titles when no row has all of them", () => {
    const rules = { score: (row: string[]) => KPI.score(row), full: KPI.full };

    const input = "Report\nperiodKey;metricCode\n2027-01;REVENUE";

    const found = findTable(input, (delimiter) => parseCsvMatrix(input, delimiter), rules);

    expect(found.delimiter).toBe(";");

    expect(found.index).toBe(1);

    expect(found.complete).toBe(false);
  });

  it("gives -1 and the first mark when no row looks like titles", () => {
    const { found, tried } = tryMarks("one,two\n3,4");

    expect(found.index).toBe(-1);

    expect(found.complete).toBe(false);

    expect(found.delimiter).toBe(",");

    expect(found.rows).toEqual([
      ["one", "two"],
      ["3", "4"],
    ]);

    expect(tried[0]).toBe(",");
  });

  it("looks at the first 200 rows only", () => {
    const lines = Array.from({ length: 200 }, (_, index) => `line ${index}`);

    const late = [...lines, "period,revenue", "2027-01,100"].join("\n");

    expect(tryMarks(late).found.index).toBe(-1);

    const inside = [...lines.slice(0, 199), "period,revenue", "2027-01,100"].join("\n");

    expect(tryMarks(inside).found.index).toBe(199);
  });
});

describe("taking away the sep= line", () => {
  it("drops the first row of a file that declares its mark", () => {
    expect(
      dropSepLine("sep=;\na;b", [
        ["sep=", ""],
        ["a", "b"],
      ]),
    ).toEqual([["a", "b"]]);
  });

  it("keeps all rows of a file that does not declare its mark", () => {
    expect(dropSepLine("a;b", [["a", "b"]])).toEqual([["a", "b"]]);
  });
});

describe("reading a file as a table", () => {
  it("reads a file that starts with its titles, as before", () => {
    const table = readCsvTable("period,revenue\n2027-01,100\n2027-02,110", ACTUALS);

    expect(table.delimiter).toBe(",");

    expect(table.headers).toEqual(["period", "revenue"]);

    expect(table.records).toEqual([
      { period: "2027-01", revenue: "100" },
      { period: "2027-02", revenue: "110" },
    ]);

    expect(table.rowNumbers).toEqual([2, 3]);

    expect(table.titleRow).toBe(1);

    expect(table.emptyColumns).toBe(0);
  });

  it("skips a title line and an empty row above the titles, and counts them in the numbers", () => {
    const csv = ["Report 2027", "", "period,revenue", "2027-01,100", "2027-02,110"].join("\n");

    const table = readCsvTable(csv, ACTUALS);

    expect(table.titleRow).toBe(3);

    expect(table.headers).toEqual(["period", "revenue"]);

    expect(table.rowNumbers).toEqual([4, 5]);
  });

  it("reads a semicolon file under a title line", () => {
    const table = readCsvTable("Report\nperiod;revenue\n2027-01;1250,50", ACTUALS);

    expect(table.delimiter).toBe(";");

    expect(table.records).toEqual([{ period: "2027-01", revenue: "1250,50" }]);

    expect(table.titleRow).toBe(2);
  });

  it("does not count the sep= line as a row", () => {
    const table = readCsvTable("sep=;\nperiod;revenue\n2027-01;100\n2027-02;110", ACTUALS);

    expect(table.delimiter).toBe(";");

    expect(table.titleRow).toBe(1);

    expect(table.rowNumbers).toEqual([2, 3]);
  });

  it("uses the mark that sep= declares", () => {
    const table = readCsvTable("sep=,\nperiod,revenue\n2027-01,100", ACTUALS);

    expect(table.delimiter).toBe(",");

    expect(table.headers).toEqual(["period", "revenue"]);
  });

  it("leaves out empty columns at the end", () => {
    const table = readCsvTable("period;revenue;;\n2027-01;100;;\n2027-02;110;;", ACTUALS);

    expect(table.headers).toEqual(["period", "revenue"]);

    expect(table.emptyColumns).toBe(2);

    expect(table.records[0]).toEqual({ period: "2027-01", revenue: "100" });
  });

  it("leaves out an empty column in the middle", () => {
    const table = readCsvTable("period;;revenue\n2027-01;;100", ACTUALS);

    expect(table.headers).toEqual(["period", "revenue"]);

    expect(table.records).toEqual([{ period: "2027-01", revenue: "100" }]);

    expect(table.emptyColumns).toBe(1);
  });

  it("refuses a column that has values and no title", () => {
    expect(message(() => readCsvTable("period,revenue,\n2027-01,100,note", ACTUALS))).toBe(
      "CSV contains an empty header.",
    );
  });

  it("refuses two columns with the same title", () => {
    expect(message(() => readCsvTable("period,revenue,revenue\n2027-01,1,2", ACTUALS))).toBe(
      "CSV contains duplicate headers.",
    );
  });

  it("refuses a file with nothing in it, also when it only declares its mark", () => {
    expect(message(() => readCsvTable("", ACTUALS))).toBe("CSV is empty.");

    expect(message(() => readCsvTable("\n\n", ACTUALS))).toBe("CSV is empty.");

    expect(message(() => readCsvTable("sep=;", ACTUALS))).toBe("CSV is empty.");
  });

  it("uses the first row when no row looks like titles, so the old messages stay", () => {
    const table = readCsvTable("one,two\n3,4", ACTUALS);

    expect(table.headers).toEqual(["one", "two"]);

    expect(table.titleRow).toBe(1);

    expect(table.rowNumbers).toEqual([2]);
  });

  it("fills a short row with empty texts", () => {
    const table = readCsvTable("period,revenue,cogs\n2027-01,100", ACTUALS);

    expect(table.records).toEqual([{ period: "2027-01", revenue: "100", cogs: "" }]);
  });

  it("gives no records for a file with titles only", () => {
    const table = readCsvTable("period,revenue", ACTUALS);

    expect(table.records).toEqual([]);

    expect(table.rowNumbers).toEqual([]);
  });

  it("reads a file with a byte order mark", () => {
    const table = readCsvTable(`${BOM}period;revenue\n2027-01;100`, ACTUALS);

    expect(table.headers).toEqual(["period", "revenue"]);
  });
});

describe("the sentence about the layout of a file", () => {
  it("says nothing for a file that starts with its titles", () => {
    expect(describeLayout({ titleRow: 1, emptyColumns: 0, emptyNumbers: 0 })).toBe(null);
  });

  it("tells the row of the titles and how many rows were not used", () => {
    expect(describeLayout({ titleRow: 2, emptyColumns: 0, emptyNumbers: 0 })).toBe(
      "The column titles are on row 2. The row above them was not used.",
    );

    expect(describeLayout({ titleRow: 4, emptyColumns: 0, emptyNumbers: 0 })).toBe(
      "The column titles are on row 4. The 3 rows above them were not used.",
    );
  });

  it("tells how many empty columns were left out", () => {
    expect(describeLayout({ titleRow: 1, emptyColumns: 1, emptyNumbers: 0 })).toBe(
      "1 empty column was left out.",
    );

    expect(describeLayout({ titleRow: 1, emptyColumns: 3, emptyNumbers: 0 })).toBe(
      "3 empty columns were left out.",
    );
  });

  it("tells how many cells with a dash or n/a were read as empty", () => {
    expect(describeLayout({ titleRow: 1, emptyColumns: 0, emptyNumbers: 1 })).toBe(
      "1 cell with a dash or n/a was read as empty.",
    );

    expect(describeLayout({ titleRow: 1, emptyColumns: 0, emptyNumbers: 4 })).toBe(
      "4 cells with a dash or n/a were read as empty.",
    );
  });

  it("puts the three parts in one text", () => {
    expect(describeLayout({ titleRow: 3, emptyColumns: 2, emptyNumbers: 1 })).toBe(
      "The column titles are on row 3. The 2 rows above them were not used. 2 empty columns were left out. 1 cell with a dash or n/a was read as empty.",
    );
  });
});

describe("a cell that says there is no number", () => {
  it("is a lone dash of any kind", () => {
    const dashes = ["-", EN_DASH, EM_DASH, MINUS_SIGN, NON_BREAKING_HYPHEN, "--", "---", " - "];

    for (const dash of dashes) {
      expect(isNoNumber(dash), dash).toBe(true);
    }
  });

  it("is n/a in any way of writing", () => {
    const words = ["n/a", "N/A", "#N/A", "na", "NA", "n.a.", "N.A", "n/d", "ND", "n.d.", "NC"];

    for (const word of words) {
      expect(isNoNumber(word), word).toBe(true);
    }
  });

  it("is not a number, an empty cell or other text", () => {
    const others = ["", "0", "-5", "5-", "--5", "----", "abc", "n/a 5", "1 000", "(100)", "--."];

    for (const other of others) {
      expect(isNoNumber(other), other).toBe(false);
    }
  });
});
