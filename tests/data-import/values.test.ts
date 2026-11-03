import { describe, expect, it } from "vitest";

import { COLUMN_TITLES, normalizeTitle } from "@/lib/data-import/headers";
import {
  CODE_FIELDS,
  CODE_TABLE,
  type CodeKind,
  describeInvalidValue,
  describeValues,
  readCodeValue,
  readRecordValues,
} from "@/lib/data-import/values";
import { parseKpiMetricCode } from "@/lib/finance/scorecard/metrics";
import {
  parseVarianceCauseCode,
  parseVarianceCommentaryStatus,
  parseVarianceMetricCode,
  parseVarianceNature,
} from "@/lib/finance/variance-review/metrics";

const E_ACUTE = String.fromCharCode(0xe9);

const U_CIRCUMFLEX = String.fromCharCode(0xfb);

const KINDS: CodeKind[] = ["KPI_METRIC", "VARIANCE_METRIC", "CAUSE", "NATURE", "STATUS"];

const words = (text: string) => text.split(" ");

/** The codes of each kind, written out again here so that a change of the app shows in a test. */
const EXPECTED_CODES: Record<CodeKind, string[]> = {
  KPI_METRIC: words(
    "REVENUE EBITDA_MARGIN CASH_BALANCE MRR CUSTOMERS RUNWAY_MONTHS FORECAST_ACCURACY",
  ),
  VARIANCE_METRIC: words(
    "REVENUE COGS OPERATING_EXPENSES EBITDA NET_INCOME CASH_FLOW CASH_BALANCE MRR CUSTOMERS",
  ),
  CAUSE: words(
    "VOLUME PRICE MIX TIMING CHURN_RETENTION INPUT_COST HEADCOUNT MARKETING OTHER_OPEX WORKING_CAPITAL ONE_OFF ACCOUNTING_CLASSIFICATION OTHER",
  ),
  NATURE: words("ONE_OFF RECURRING STRUCTURAL UNKNOWN"),
  STATUS: words("OPEN MONITORING RESOLVED ACCEPTED"),
};

/** The names that are added for the codes that are not a column of the Actuals file. */
const EXPECTED_NAMES: Record<string, Record<string, string[]>> = {
  KPI_METRIC: {
    EBITDA_MARGIN: words("margeebitda margedebitda margeebe margedebe"),
    RUNWAY_MONTHS: words("runway moisderunway autonomiedetresorerie autonomiefinanciere"),
    FORECAST_ACCURACY: words(
      "accuracy precisiondesprevisions precisionprevisionnelle fiabilitedesprevisions",
    ),
  },
  CAUSE: {
    VOLUME: words("volumes quantite quantites"),
    PRICE: words("prices prix tarif tarifs"),
    MIX: words("productmix mixproduit mixproduits mixdeproduits"),
    TIMING: words("calendrier decalage decalagedecalendrier decalagetemporel"),
    CHURN_RETENTION: words("churn retention attrition perteclients pertedeclients fidelisation"),
    INPUT_COST: words("inputcosts coutdesintrants coutdesmatieres coutdesmatierespremieres"),
    HEADCOUNT: words("effectif effectifs personnel massesalariale"),
    MARKETING: words("publicite communication"),
    OTHER_OPEX: words(
      "otheroperatingexpenses autresopex autreschargesdexploitation autreschargesexploitation",
    ),
    WORKING_CAPITAL: words("bfr besoinenfondsderoulement"),
    ONE_OFF: words("exceptionnel exceptionnelle ponctuel ponctuelle"),
    ACCOUNTING_CLASSIFICATION: words("classificationcomptable reclassement reclassementcomptable"),
    OTHER: words("autre autres"),
  },
  NATURE: {
    ONE_OFF: words("exceptionnel exceptionnelle ponctuel ponctuelle unique"),
    RECURRING: words("recurrent recurrente recurrents recurrentes"),
    STRUCTURAL: words("structurel structurelle structurels structurelles"),
    UNKNOWN: words("inconnu inconnue nonconnu nonconnue"),
  },
  STATUS: {
    OPEN: words("ouvert ouverte"),
    MONITORING: words("monitored suivi ensuivi surveillance ensurveillance"),
    RESOLVED: words("resolu resolue regle reglee"),
    ACCEPTED: words("accepte acceptee acceptes"),
  },
};

/** The column of the Actuals file that has the names of each metric. */
const ACTUALS_FIELD: Record<string, string> = {
  REVENUE: "revenue",
  COGS: "cogs",
  OPERATING_EXPENSES: "operatingExpenses",
  EBITDA: "ebitda",
  NET_INCOME: "netIncome",
  CASH_FLOW: "cashFlow",
  CASH_BALANCE: "cashBalance",
  MRR: "mrr",
  CUSTOMERS: "customers",
};

/** The names of one code, with its own name once, even when the list has it too. */
function allNames(kind: CodeKind, code: string): string[] {
  return Array.from(new Set([normalizeTitle(code), ...CODE_TABLE[kind].names[code]]));
}

function messageOf(read: () => unknown): string {
  try {
    read();
  } catch (cause) {
    return cause instanceof Error ? cause.message : "not an error";
  }

  return "no error";
}

describe("the table of codes", () => {
  it("has the codes of the app, in the order of the app", () => {
    for (const kind of KINDS) {
      expect([...CODE_TABLE[kind].codes], kind).toEqual(EXPECTED_CODES[kind]);
    }
  });

  it("has a list of names for every code and for nothing else", () => {
    for (const kind of KINDS) {
      expect(Object.keys(CODE_TABLE[kind].names).sort(), kind).toEqual(
        [...EXPECTED_CODES[kind]].sort(),
      );
    }
  });

  it("gives the metrics that are a column of the Actuals file the names of that column", () => {
    for (const kind of ["KPI_METRIC", "VARIANCE_METRIC"] as const) {
      for (const code of CODE_TABLE[kind].codes) {
        const field = ACTUALS_FIELD[code];

        if (field !== undefined) {
          expect(CODE_TABLE[kind].names[code], `${kind} ${code}`).toBe(
            COLUMN_TITLES.ACTUALS[field],
          );
        }
      }
    }
  });

  it("has the names that the tests expect for the other codes", () => {
    for (const [kind, codes] of Object.entries(EXPECTED_NAMES)) {
      for (const [code, names] of Object.entries(codes)) {
        expect(CODE_TABLE[kind as CodeKind].names[code], `${kind} ${code}`).toEqual(names);
      }
    }
  });

  it("has no other code than the ones that the tests know", () => {
    for (const kind of KINDS) {
      for (const code of CODE_TABLE[kind].codes) {
        const known = ACTUALS_FIELD[code] !== undefined && kind.endsWith("METRIC");

        const listed = EXPECTED_NAMES[kind]?.[code] !== undefined;

        expect(known || listed, `${kind} ${code}`).toBe(true);
      }
    }
  });

  it("never gives one name to two codes of one kind", () => {
    for (const kind of KINDS) {
      const all = CODE_TABLE[kind].codes.flatMap((code) => allNames(kind, code));

      expect(new Set(all).size, kind).toBe(all.length);
    }
  });

  it("is made of plain lower case letters and digits", () => {
    for (const kind of KINDS) {
      for (const code of CODE_TABLE[kind].codes) {
        for (const name of allNames(kind, code)) {
          expect(name, `${kind} ${code}`).toBe(normalizeTitle(name));

          expect(name, `${kind} ${code}`).not.toBe("");
        }
      }
    }
  });
});

describe("readCodeValue", () => {
  it("reads every name of every code, in every way of writing it", () => {
    for (const kind of KINDS) {
      for (const code of CODE_TABLE[kind].codes) {
        for (const name of allNames(kind, code)) {
          const spaced = name.toUpperCase().split("").join(" ");

          for (const written of [name, spaced, `${name}_`, ` ${name} `]) {
            expect(readCodeValue(kind, written), `${kind} ${written}`).toBe(code);
          }
        }
      }
    }
  });

  it("reads the code itself with capital letters, small letters, spaces or a dash", () => {
    for (const kind of KINDS) {
      for (const code of CODE_TABLE[kind].codes) {
        const lower = code.toLowerCase();

        const title = lower.charAt(0).toUpperCase() + lower.slice(1);

        for (const written of [
          code,
          lower,
          title,
          code.replace(/_/g, " "),
          code.replace(/_/g, "-"),
        ]) {
          expect(readCodeValue(kind, written), `${kind} ${written}`).toBe(code);
        }
      }
    }
  });

  it("reads French names with their accents", () => {
    const pairs: [CodeKind, string, string][] = [
      ["KPI_METRIC", `Tr${E_ACUTE}sorerie`, "CASH_BALANCE"],
      ["KPI_METRIC", "Marge d'EBITDA", "EBITDA_MARGIN"],
      ["KPI_METRIC", `Autonomie de tr${E_ACUTE}sorerie`, "RUNWAY_MONTHS"],
      ["KPI_METRIC", `Pr${E_ACUTE}cision des pr${E_ACUTE}visions`, "FORECAST_ACCURACY"],
      ["VARIANCE_METRIC", `Co${U_CIRCUMFLEX}t des ventes`, "COGS"],
      ["VARIANCE_METRIC", `R${E_ACUTE}sultat net`, "NET_INCOME"],
      ["CAUSE", `D${E_ACUTE}calage de calendrier`, "TIMING"],
      ["CAUSE", `Publicit${E_ACUTE}`, "MARKETING"],
      ["CAUSE", `Exceptionnel`, "ONE_OFF"],
      ["NATURE", `R${E_ACUTE}current`, "RECURRING"],
      ["NATURE", `Structurelle`, "STRUCTURAL"],
      ["STATUS", `R${E_ACUTE}solu`, "RESOLVED"],
      ["STATUS", `R${E_ACUTE}gl${E_ACUTE}`, "RESOLVED"],
      ["STATUS", `Accept${E_ACUTE}`, "ACCEPTED"],
      ["STATUS", "En suivi", "MONITORING"],
    ];

    for (const [kind, text, code] of pairs) {
      expect(readCodeValue(kind, text), `${kind} ${text}`).toBe(code);
    }
  });

  it("gives null for an empty text or a text that is no name", () => {
    for (const kind of KINDS) {
      for (const text of [
        "",
        "   ",
        "???",
        "Foo",
        "Revnue",
        "constructor",
        "__proto__",
        "toString",
      ]) {
        expect(readCodeValue(kind, text), `${kind} ${text}`).toBeNull();
      }
    }
  });

  it("does not read the names of another kind", () => {
    expect(readCodeValue("CAUSE", "RECURRING")).toBeNull();

    expect(readCodeValue("NATURE", "VOLUME")).toBeNull();

    expect(readCodeValue("STATUS", "OTHER")).toBeNull();

    expect(readCodeValue("KPI_METRIC", "EBITDA")).toBeNull();

    expect(readCodeValue("VARIANCE_METRIC", "EBITDA_MARGIN")).toBeNull();

    expect(readCodeValue("KPI_METRIC", "COGS")).toBeNull();
  });

  it("reads ONE_OFF as a cause and as a nature", () => {
    expect(readCodeValue("CAUSE", "One-off")).toBe("ONE_OFF");

    expect(readCodeValue("NATURE", "One off")).toBe("ONE_OFF");
  });
});

describe("the fields that hold a code", () => {
  it("are none for Actuals, one for KPI targets and four for variance comments", () => {
    expect(CODE_FIELDS).toEqual({
      ACTUALS: {},
      KPI_TARGETS: { metricCode: "KPI_METRIC" },
      VARIANCE_COMMENTARY: {
        metricCode: "VARIANCE_METRIC",
        causeCode: "CAUSE",
        varianceNature: "NATURE",
        status: "STATUS",
      },
    });
  });
});

describe("readRecordValues", () => {
  it("replaces the names by the codes and tells which texts were read with other text", () => {
    const record = {
      periodKey: "2027-01",
      metricCode: "Marge EBITDA",
      causeCode: "Prix",
      varianceNature: `R${E_ACUTE}current`,
      status: "Suivi",
      explanation: "Prix",
    };

    const result = readRecordValues("VARIANCE_COMMENTARY", record);

    expect(result.record).toEqual({
      ...record,
      metricCode: "Marge EBITDA",
      causeCode: "PRICE",
      varianceNature: "RECURRING",
      status: "MONITORING",
    });

    expect(result.read).toEqual([
      { field: "causeCode", text: "Prix", code: "PRICE" },
      { field: "varianceNature", text: `R${E_ACUTE}current`, code: "RECURRING" },
      { field: "status", text: "Suivi", code: "MONITORING" },
    ]);
  });

  it("reads the metric of a KPI file with the list of KPIs and not the list of metrics", () => {
    const result = readRecordValues("KPI_TARGETS", {
      metricCode: "Marge EBITDA",
      targetValue: "1",
    });

    expect(result.record).toEqual({ metricCode: "EBITDA_MARGIN", targetValue: "1" });

    expect(result.read).toEqual([
      { field: "metricCode", text: "Marge EBITDA", code: "EBITDA_MARGIN" },
    ]);

    expect(readRecordValues("VARIANCE_COMMENTARY", { metricCode: "Marge EBITDA" }).record).toEqual({
      metricCode: "Marge EBITDA",
    });
  });

  it("does not list a text that differs from its code only in capital letters", () => {
    const result = readRecordValues("KPI_TARGETS", { metricCode: "revenue" });

    expect(result.record).toEqual({ metricCode: "REVENUE" });

    expect(result.read).toEqual([]);

    expect(readRecordValues("KPI_TARGETS", { metricCode: "Revenue" }).read).toEqual([]);

    expect(readRecordValues("KPI_TARGETS", { metricCode: "EBITDA_margin" }).read).toEqual([]);
  });

  it("lists a text that has other letters or marks than the code", () => {
    expect(readRecordValues("KPI_TARGETS", { metricCode: "EBITDA margin" }).read).toEqual([
      { field: "metricCode", text: "EBITDA margin", code: "EBITDA_MARGIN" },
    ]);

    expect(readRecordValues("KPI_TARGETS", { metricCode: "ebitda-margin" }).read).toEqual([
      { field: "metricCode", text: "ebitda-margin", code: "EBITDA_MARGIN" },
    ]);
  });

  it("gives the text without the spaces around it", () => {
    const result = readRecordValues("VARIANCE_COMMENTARY", { status: "  Suivi  " });

    expect(result.read).toEqual([{ field: "status", text: "Suivi", code: "MONITORING" }]);
  });

  it("keeps an empty text and an unknown text as they were, and tells nothing", () => {
    const record = { metricCode: "Foo", causeCode: "", varianceNature: "  ", status: "Qux" };

    const result = readRecordValues("VARIANCE_COMMENTARY", record);

    expect(result.record).toEqual(record);

    expect(result.read).toEqual([]);
  });

  it("skips a field that the row does not have", () => {
    const result = readRecordValues("VARIANCE_COMMENTARY", { metricCode: "Ventes" });

    expect(result.record).toEqual({ metricCode: "REVENUE" });
  });

  it("does not read the fields of another kind of file", () => {
    const record = { metricCode: "Revenue", causeCode: "Prix", status: "Suivi" };

    expect(readRecordValues("KPI_TARGETS", record).record).toEqual({
      metricCode: "REVENUE",
      causeCode: "Prix",
      status: "Suivi",
    });

    expect(readRecordValues("ACTUALS", record)).toEqual({ record, read: [] });
  });

  it("does not change the row that it was given", () => {
    const record = { metricCode: "Chiffre d'affaires" };

    readRecordValues("KPI_TARGETS", record);

    expect(record).toEqual({ metricCode: "Chiffre d'affaires" });
  });
});

describe("describeInvalidValue", () => {
  it("adds the codes to the five messages of the checks of the app", () => {
    const messages: [CodeKind, string][] = [
      ["KPI_METRIC", messageOf(() => parseKpiMetricCode("Foo"))],
      ["VARIANCE_METRIC", messageOf(() => parseVarianceMetricCode("Foo"))],
      ["CAUSE", messageOf(() => parseVarianceCauseCode("Foo"))],
      ["NATURE", messageOf(() => parseVarianceNature("Foo"))],
      ["STATUS", messageOf(() => parseVarianceCommentaryStatus("Foo"))],
    ];

    for (const [kind, message] of messages) {
      expect(describeInvalidValue(message), kind).toBe(
        `${message} Use one of: ${EXPECTED_CODES[kind].join(", ")}.`,
      );
    }
  });

  it("gives the whole message for a KPI and for a nature", () => {
    expect(describeInvalidValue("Invalid KPI metric.")).toBe(
      "Invalid KPI metric. Use one of: REVENUE, EBITDA_MARGIN, CASH_BALANCE, MRR, CUSTOMERS, RUNWAY_MONTHS, FORECAST_ACCURACY.",
    );

    expect(describeInvalidValue("Invalid variance nature.")).toBe(
      "Invalid variance nature. Use one of: ONE_OFF, RECURRING, STRUCTURAL, UNKNOWN.",
    );
  });

  it("gives back any other message as it was", () => {
    for (const message of [
      "",
      "Invalid value.",
      "constructor",
      "Invalid KPI metric",
      "explanation must contain between 5 and 2000 characters.",
    ]) {
      expect(describeInvalidValue(message), message).toBe(message);
    }
  });
});

describe("describeValues", () => {
  it("says nothing when no text was read with other text", () => {
    expect(describeValues([])).toBeNull();
  });

  it("tells the texts that were read, one after the other", () => {
    expect(
      describeValues([
        { field: "metricCode", text: "Marge EBITDA", code: "EBITDA_MARGIN" },
        { field: "status", text: "Suivi", code: "MONITORING" },
      ]),
    ).toBe("Values were read like this: Marge EBITDA = EBITDA_MARGIN, Suivi = MONITORING.");
  });

  it("tells a pair once, even when two fields have it", () => {
    expect(
      describeValues([
        { field: "causeCode", text: "Exceptionnel", code: "ONE_OFF" },
        { field: "varianceNature", text: "Exceptionnel", code: "ONE_OFF" },
      ]),
    ).toBe("Values were read like this: Exceptionnel = ONE_OFF.");
  });

  it("shows eight pairs and counts the others", () => {
    const names = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

    const values = names.map((text) => ({ field: "causeCode", text, code: "OTHER" }));

    expect(describeValues(values.slice(0, 8))).toBe(
      "Values were read like this: a = OTHER, b = OTHER, c = OTHER, d = OTHER, e = OTHER, f = OTHER, g = OTHER, h = OTHER.",
    );

    expect(describeValues(values)).toBe(
      "Values were read like this: a = OTHER, b = OTHER, c = OTHER, d = OTHER, e = OTHER, f = OTHER, g = OTHER, h = OTHER and 2 more.",
    );
  });
});
