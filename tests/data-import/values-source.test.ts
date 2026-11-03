import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const values = read("lib/data-import/values.ts");

const headers = read("lib/data-import/headers.ts");

const validation = read("lib/data-import/validation.ts");

const types = read("lib/data-import/types.ts");

const workbench = read("components/data-import/data-import-workbench.tsx");

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

describe("the reader of the values", () => {
  it("uses only plain ASCII characters", () => {
    expect(/^[\x00-\x7f]*$/.test(values)).toBe(true);
  });

  it("shares the names of the Actuals titles and the way of writing a title", () => {
    expect(values).toContain(
      'import { COLUMN_TITLES, normalizeTitle, shortList } from "@/lib/data-import/headers";',
    );

    expect(values).toContain("const ACTUALS = COLUMN_TITLES.ACTUALS;");
  });

  it("puts the code itself first, so no other name can take its place", () => {
    expect(squash(values)).toContain("lookup.set(normalizeTitle(code),code);");

    expect(squash(values)).toContain("if(lookup.has(name)){continue;}lookup.set(name,code);");

    expect(values.indexOf("lookup.set(normalizeTitle(code)")).toBeLessThan(
      values.indexOf("lookup.set(name, code)"),
    );
  });

  it("keeps an empty text or an unknown text as it was", () => {
    expect(squash(values)).toContain("if(code===null){continue;}");

    expect(squash(values)).toContain("if(text.toLowerCase()!==code.toLowerCase()){");
  });

  it("only changes the messages of the five checks of the app", () => {
    expect(squash(values)).toContain("if(kind===undefined){returnmessage;}");

    for (const message of [
      "Invalid KPI metric.",
      "Invalid variance metric.",
      "Invalid variance root cause.",
      "Invalid variance nature.",
      "Invalid variance review status.",
    ]) {
      expect(values, message).toContain(`"${message}"`);
    }
  });
});

describe("the list of shared helpers", () => {
  it("lets the reader of the values use the short list of the titles", () => {
    expect(headers).toContain("export function shortList(items: string[]): string {");
  });
});

describe("the Data Import Center", () => {
  it("reads the values of a row after its numbers and before it checks the row", () => {
    const flat = squash(validation);

    expect(flat).toContain("const{record:numbered,problems,emptied,}=readRecordNumbers(");

    expect(flat).toContain("const{record,read,}=readRecordValues(importType,numbered,);");

    expect(flat.indexOf("readRecordNumbers(importType")).toBeLessThan(
      flat.indexOf("readRecordValues(importType"),
    );

    expect(flat.indexOf("readRecordValues(importType")).toBeLessThan(
      flat.lastIndexOf("validateKpiRow({record"),
    );
  });

  it("keeps each text once and gives the list back in the result", () => {
    const flat = squash(validation);

    expect(flat).toContain("readValues.set(`${item.field}|${item.text}`,item,);");

    expect(flat).toContain("readValues:Array.from(readValues.values(),),");

    expect(flat).toContain("constreadValues=newMap<string,ReadValue>();");
  });

  it("adds the codes to the message of a code that is not valid", () => {
    expect(squash(validation)).toContain("describeInvalidValue(cause.message,)");

    expect(squash(validation)).toContain('from"@/lib/data-import/values"');
  });

  it("gives the type of the result the list of the texts that were read", () => {
    expect(squash(types)).toContain("readValues:{field:string;text:string;code:string;}[];");
  });
});

describe("the import screen", () => {
  it("shows a note about the values, after the note about the titles and before the preview", () => {
    expect(workbench.split("<ImportValuesNote").length - 1).toBe(1);

    expect(workbench).toContain("function ImportValuesNote({");

    expect(squash(workbench)).toContain("describeValues(values,)");

    expect(workbench).toContain('data-slot="import-values-note"');

    expect(squash(workbench)).toContain("<ImportValuesNotevalues={validation.result.readValues}/>");

    const columns = workbench.indexOf("<ImportColumnsNote");

    const valuesNote = workbench.indexOf("<ImportValuesNote");

    const preview = workbench.indexOf("First eight rows only.");

    expect(valuesNote).toBeGreaterThan(columns);

    expect(preview).toBeGreaterThan(valuesNote);
  });

  it("tells in the hint that the codes can be written as names", () => {
    expect(workbench).toContain(
      "Capital letters and spaces do not matter. In KPI and variance files the codes can be written as names too, like Revenue, Marge EBITDA, Volume or Suivi.",
    );
  });
});

describe("the README", () => {
  const section = readmeSection("Values as people write them");

  it("explains the problem, the fixes, the rules and the limits", () => {
    for (const piece of [
      "`Revenue`, `revenue`, `EBITDA margin`, `Marge EBITDA` and `Chiffre d'affaires` were all refused",
      "`Volume`, `Recurring` and `Monitoring` were refused",
      'The message was only "Invalid KPI metric."',
      "`lib/data-import/values.ts`",
      "(`REVENUE`, `Revenue`, `ebitda margin`, `EBITDA_MARGIN`)",
      "French names are added",
      "has the same names as that column",
      "**What is stored:** the code",
      "The preview still shows the text of the file",
      "Values were read like this: Marge EBITDA = EBITDA_MARGIN.",
      "A text that differs from its code only in capital letters is not listed",
      "the message now lists the codes that can be used",
      "An empty value is refused in the same way",
      "so a spelling mistake is not guessed",
      "`EBITDA` is not read as `EBITDA_MARGIN`",
      "Arabic names and the names of other languages are not read",
      "The Actuals file has no codes, so it is read as before",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its three test files", () => {
    for (const name of [
      "tests/data-import/values.test.ts",
      "tests/data-import/values-import.test.ts",
      "tests/data-import/values-source.test.ts",
    ]) {
      expect(section, name).toContain(`\`${name}\``);
    }
  });

  it("comes after the section about column titles and before the download section", () => {
    const titles = readme.indexOf("## Column titles as people write them");

    const here = readme.indexOf("## Values as people write them");

    const download = readme.indexOf("## Download your data");

    expect(titles).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(titles);

    expect(download).toBeGreaterThan(here);
  });
});
