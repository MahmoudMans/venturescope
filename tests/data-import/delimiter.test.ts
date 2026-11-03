import { describe, expect, it } from "vitest";

import { describeDelimiter, detectCsvDelimiter } from "@/lib/data-import/delimiter";

describe("detectCsvDelimiter", () => {
  const cases: [string, string, string][] = [
    ["a normal comma file", "a,b,c\n1,2,3", ","],
    ["a file from Excel with French settings", "period;revenue;cogs\n2027-01;1250,50;300", ";"],
    ["a text file with tabs", "period\trevenue\n2027-01\t1250", "\t"],
    ["a file with one column", "period\n2027-01", ","],
    ["an empty text", "", ","],
    ["a text with only spaces", "   \n  ", ","],
    ["a semicolon file with a byte order mark", "\uFEFFperiod;revenue\n2027-01;5", ";"],
    ["a semicolon file with Windows line breaks", "period;revenue\r\n2027-01;5\r\n", ";"],
    ["blank lines before the header", "\n\nperiod;revenue\n2027-01;5", ";"],
    ["a line with only marks before the header", ";;;\nperiod,revenue,cogs\n1,2,3", ","],
    ["a semicolon inside quotes", '"a;b;c;d",e,f\n1,2,3', ","],
    ["commas inside quotes", '"a,b,c,d";e;f\n1;2;3', ";"],
    ["a header that is only quoted words", '"period";"revenue"\n"1,5","2,5","3,5"', ";"],
    ["a line of commas before the header", ",,,\nperiod;revenue;cogs\n", ";"],
    ["a line of tabs before the header", "\t\t\t\t\nperiod,revenue,cogs,x\n", ","],
    ["a line of spaces before the header", "   \nperiod;revenue", ";"],
    ["the same count of commas and semicolons", "a,b;c\n1,2;3", ","],
    ["more commas than semicolons", "a,b,c;d", ","],
    ["more semicolons than commas", "a;b;c,d", ";"],
    ["the same count of semicolons and tabs", "a;b\tc", ";"],
    ["more tabs than semicolons", "a\tb\tc;d", "\t"],
    ["decimal commas in the data lines", "period;revenue\n2027-01;1,5\n2027-02;2,5,5,5", ";"],
    ["marks in the data lines only", "a,b\n1;2;3;4;5\n6;7;8;9", ","],
    ["a quote that never ends", '"a;b', ","],
  ];

  it("picks the mark that is used most on the first line", () => {
    for (const [name, text, expected] of cases) {
      expect(detectCsvDelimiter(text), name).toBe(expected);
    }
  });
});

describe("detectCsvDelimiter: line breaks", () => {
  it("stops at a line break of an old Mac file, which is a lone carriage return", () => {
    expect(detectCsvDelimiter("a;b\r1,2,3,4,5")).toBe(";");

    expect(detectCsvDelimiter("a\tb\r1,2,3,4,5")).toBe("\t");
  });
});

describe("describeDelimiter", () => {
  it("says nothing for a normal comma file", () => {
    expect(describeDelimiter(",")).toBeNull();
  });

  it("tells that a semicolon file has a decimal comma", () => {
    expect(describeDelimiter(";")).toBe(
      "This file is separated by semicolons, so a comma in a number is read as a decimal comma: 1250,50 is read as 1250.50.",
    );
  });

  it("tells that a file is separated by tabs", () => {
    expect(describeDelimiter("\t")).toBe("This file is separated by tabs.");
  });
});
