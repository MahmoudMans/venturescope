import { describe, expect, it } from "vitest";

import { parseMonthKey } from "@/lib/finance/actuals/month";
import { readMonthColumn } from "@/lib/finance/actuals/month-column";

const E_ACUTE = String.fromCharCode(0xe9);

const U_CIRCUMFLEX = String.fromCharCode(0xfb);

describe("parseMonthKey: the months that Excel writes", () => {
  const cases: [string, string | null][] = [
    ["Jan-27", "2027-01"],
    ["jan-27", "2027-01"],
    ["JAN-27", "2027-01"],
    ["Feb 27", "2027-02"],
    ["Mar/27", "2027-03"],
    ["Apr,27", "2027-04"],
    ["May-27", "2027-05"],
    ["Dec-27", "2027-12"],
    ["Jan-00", "2000-01"],
    ["Jan-99", "2099-01"],
    ["Jan-2027", "2027-01"],
    ["January 2027", "2027-01"],
    ["Jan.-27", "2027-01"],
    ["Jan. 2027", "2027-01"],
    ["2027 Jan", "2027-01"],
    ["2027 Jan.", "2027-01"],
    ["27-Jan-27", "2027-01"],
    ["27.Jan.2027", "2027-01"],
    ["27-Jan-2027", "2027-01"],
    ["1 January 2027", "2027-01"],
    ["31/Mar/2027", "2027-03"],
    ["1 Jan 27", "2027-01"],
    ["2027-01", "2027-01"],
    ["2027-01-31", "2027-01"],
    ["01/2027", "2027-01"],
    ["Jan 2027", "2027-01"],
    ["Jan 7", null],
    ["Jan 777", null],
    ["27-Jan", null],
    ["0 Jan 27", null],
    ["32 Jan 27", null],
    ["99 Jan 27", null],
    ["Xyz-27", null],
    ["abc", null],
    ["", null],
    ["27", null],
    ["Jan-1", null],
    ["Jan-1999", null],
    ["Jan-2101", null],
  ];

  it("reads a month with a year of two or four digits", () => {
    for (const [raw, expected] of cases) {
      expect(parseMonthKey(raw), JSON.stringify(raw)).toBe(expected);
    }
  });
});

describe("parseMonthKey: French month names", () => {
  const names: [string, number][] = [
    ["janv", 1],
    ["janvier", 1],
    [`f${E_ACUTE}vr`, 2],
    [`f${E_ACUTE}vrier`, 2],
    ["fevr", 2],
    ["fev", 2],
    ["mars", 3],
    ["avr", 4],
    ["avril", 4],
    ["mai", 5],
    ["juin", 6],
    ["juil", 7],
    ["juillet", 7],
    [`ao${U_CIRCUMFLEX}t`, 8],
    ["aout", 8],
    ["sept", 9],
    ["septembre", 9],
    ["oct", 10],
    ["octobre", 10],
    ["nov", 11],
    ["novembre", 11],
    [`d${E_ACUTE}c`, 12],
    [`d${E_ACUTE}cembre`, 12],
  ];

  it("reads the name with or without an accent, a dot, and a short or long year", () => {
    for (const [name, month] of names) {
      const key = `2027-${String(month).padStart(2, "0")}`;

      for (const raw of [
        `${name}-27`,
        `${name}. 27`,
        `${name}.-27`,
        `${name} 2027`,
        `${name}. 2027`,
      ]) {
        expect(parseMonthKey(raw), JSON.stringify(raw)).toBe(key);
      }
    }
  });

  it("reads a French date with a day", () => {
    expect(parseMonthKey(`1 f${E_ACUTE}vrier 2027`)).toBe("2027-02");

    expect(parseMonthKey("15 janv. 2027")).toBe("2027-01");

    expect(parseMonthKey(`28-f${E_ACUTE}vr.-27`)).toBe("2027-02");
  });

  it("does not read a name that is not a month", () => {
    expect(parseMonthKey("mardi-27")).toBeNull();

    expect(parseMonthKey("janvx-27")).toBeNull();
  });
});

describe("readMonthColumn: a column with no full date", () => {
  it("does not change anything", () => {
    const cells = ["2027-01", "Jan-27", "janv. 2027", "", "abc"];

    const read = readMonthColumn(cells, { unique: true, dayFirstDefault: true });

    expect(read.cells).toEqual(cells);

    expect(read.problem).toBeNull();
  });

  it("works for an empty column", () => {
    expect(readMonthColumn([], { unique: true, dayFirstDefault: false })).toEqual({
      cells: [],
      problem: null,
    });
  });
});

describe("readMonthColumn: a number above 12 shows the order", () => {
  const options = { unique: false, dayFirstDefault: false };

  it("reads a day above 12 as day first, like 31/01/2027", () => {
    const read = readMonthColumn(["31/01/2027", "28/02/2027", "01/03/2027"], options);

    expect(read.cells).toEqual(["2027-01", "2027-02", "2027-03"]);

    expect(read.problem).toBeNull();
  });

  it("reads a second number above 12 as month first, like 01/31/2027", () => {
    const read = readMonthColumn(["01/31/2027", "02/28/2027", "03/01/2027"], options);

    expect(read.cells).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("uses the sign for the cells before it too", () => {
    const read = readMonthColumn(["01/02/2027", "03/04/2027", "31/05/2027"], options);

    expect(read.cells).toEqual(["2027-02", "2027-04", "2027-05"]);
  });

  it("is stronger than the semicolon habit and than the unique rule", () => {
    const read = readMonthColumn(["01/31/2027", "02/01/2027"], {
      unique: true,
      dayFirstDefault: true,
    });

    expect(read.cells).toEqual(["2027-01", "2027-02"]);
  });

  it("gives a problem when the dates use both orders", () => {
    const first = readMonthColumn(["31/01/2027", "02/28/2027"], options);

    expect(first.cells).toEqual(["31/01/2027", "02/28/2027"]);

    expect(first.problem).toEqual({
      index: 1,
      message:
        "The dates in this column are written in two different orders (day first and month first), so they cannot be read. Write each month as 2027-01.",
    });

    const second = readMonthColumn(["01/01/2027", "02/28/2027", "31/03/2027"], options);

    expect(second.problem?.index).toBe(2);
  });
});

describe("readMonthColumn: dates that can be read in two ways", () => {
  it("takes the order in which no month repeats, for a file with one row per month", () => {
    const frenchStyle = readMonthColumn(["01/01/2027", "01/02/2027", "01/03/2027"], {
      unique: true,
      dayFirstDefault: false,
    });

    expect(frenchStyle.cells).toEqual(["2027-01", "2027-02", "2027-03"]);

    const americanStyle = readMonthColumn(["1/1/2027", "2/1/2027", "3/1/2027"], {
      unique: true,
      dayFirstDefault: false,
    });

    expect(americanStyle.cells).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("does not use that rule when a month may repeat", () => {
    const read = readMonthColumn(["1/1/2027", "2/1/2027", "3/1/2027"], {
      unique: false,
      dayFirstDefault: false,
    });

    expect(read.cells).toEqual(["1/1/2027", "2/1/2027", "3/1/2027"]);

    expect(read.problem?.index).toBe(1);
  });

  it("takes the day first for a file with semicolons", () => {
    const read = readMonthColumn(["03/04/2027"], { unique: false, dayFirstDefault: true });

    expect(read.cells).toEqual(["2027-04"]);

    expect(read.problem).toBeNull();
  });

  it("keeps the order of the data when it disagrees with the semicolon habit", () => {
    const read = readMonthColumn(["1/1/2027", "2/1/2027", "3/1/2027"], {
      unique: true,
      dayFirstDefault: true,
    });

    expect(read.cells).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  it("does not guess for one date in a file with commas, and tells both answers", () => {
    const read = readMonthColumn(["03/04/2027"], { unique: true, dayFirstDefault: false });

    expect(read.cells).toEqual(["03/04/2027"]);

    expect(read.problem).toEqual({
      index: 0,
      message:
        '"03/04/2027" is not clear. Write 2027-04 if it is 3 April, or 2027-03 if it is 4 March.',
    });
  });

  it("tells the cell that is not clear, with its spaces removed", () => {
    const read = readMonthColumn(["01/01/2027", " 12/11/2027 "], {
      unique: false,
      dayFirstDefault: false,
    });

    expect(read.problem?.index).toBe(1);

    const other = readMonthColumn(["13/01/2027", " 12/11/2027 "], {
      unique: false,
      dayFirstDefault: false,
    });

    expect(other.cells).toEqual(["2027-01", "2027-11"]);

    const only = readMonthColumn([" 12/11/2027 "], { unique: false, dayFirstDefault: false });

    expect(only.problem?.message).toBe(
      '"12/11/2027" is not clear. Write 2027-11 if it is 12 November, or 2027-12 if it is 11 December.',
    );
  });

  it("is not a problem when both orders give the same month", () => {
    const read = readMonthColumn(["05/05/2027", "12/12/2027"], {
      unique: false,
      dayFirstDefault: false,
    });

    expect(read.cells).toEqual(["2027-05", "2027-12"]);

    expect(read.problem).toBeNull();
  });

  it("does not decide when both orders repeat a month", () => {
    const read = readMonthColumn(["01/02/2027", "01/02/2027"], {
      unique: true,
      dayFirstDefault: false,
    });

    expect(read.problem?.index).toBe(0);
  });
});

describe("readMonthColumn: the forms of a date", () => {
  const options = { unique: false, dayFirstDefault: true };

  it("reads a dot or a dash as the mark, like in Germany", () => {
    expect(readMonthColumn(["31.01.2027", "28-02-2027"], options).cells).toEqual([
      "2027-01",
      "2027-02",
    ]);
  });

  it("reads a date with a time, like Excel writes for a date and time cell", () => {
    const read = readMonthColumn(
      ["31/01/2027 00:00", "28/02/2027 12:30:15", "31/03/2027T08:00", "30/04/2027 8:30"],
      options,
    );

    expect(read.cells).toEqual(["2027-01", "2027-02", "2027-03", "2027-04"]);
  });

  it("does not read a date with text before it or after it", () => {
    for (const raw of ["due 31/01/2027", "31/01/2027 due", "x31/01/2027"]) {
      expect(readMonthColumn([raw], options).cells, raw).toEqual([raw]);
    }
  });

  it("does not read a date with two different marks, or with a year of two digits", () => {
    for (const raw of ["31/01-2027", "31/01/27", "2027/31/01", "31/01/2027 25"]) {
      const read = readMonthColumn([raw], options);

      expect(read.cells, raw).toEqual([raw]);

      expect(read.problem, raw).toBeNull();
    }
  });

  it("leaves a date that does not exist as it is, so the check can refuse it", () => {
    const read = readMonthColumn(["31/02/2027", "31/01/2027", "29/02/2028", "29/02/2027"], options);

    expect(read.cells).toEqual(["31/02/2027", "2027-01", "2028-02", "29/02/2027"]);
  });

  it("leaves a date with a year that is out of range as it is", () => {
    const read = readMonthColumn(["31/01/1999", "31/01/2101"], options);

    expect(read.cells).toEqual(["31/01/1999", "31/01/2101"]);
  });

  it("does not read a month 0 or a day 0", () => {
    for (const raw of ["00/01/2027", "01/00/2027", "00/00/2027"]) {
      expect(readMonthColumn([raw], options).cells, raw).toEqual([raw]);
    }
  });

  it("changes only the full dates of a mixed column", () => {
    const read = readMonthColumn(["31/01/2027", "2027-02", "Mar-27", "", "abc"], options);

    expect(read.cells).toEqual(["2027-01", "2027-02", "Mar-27", "", "abc"]);
  });

  it("keeps the number of cells and their order", () => {
    const cells = ["31/01/2027", "", "28/02/2027", "x"];

    expect(readMonthColumn(cells, options).cells).toHaveLength(4);
  });
});

describe("readMonthColumn: the message names the month", () => {
  it("gives the name of the right month for all twelve months", () => {
    const names = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    for (let month = 1; month <= 12; month += 1) {
      const first = (month % 12) + 1;

      const cell = `${first}/${month}/2027`;

      const read = readMonthColumn([cell], { unique: false, dayFirstDefault: false });

      const dayFirstKey = `2027-${String(month).padStart(2, "0")}`;

      const monthFirstKey = `2027-${String(first).padStart(2, "0")}`;

      expect(read.problem?.message, cell).toBe(
        `"${cell}" is not clear. Write ${dayFirstKey} if it is ${first} ${names[month - 1]}, or ${monthFirstKey} if it is ${month} ${names[first - 1]}.`,
      );
    }
  });
});
