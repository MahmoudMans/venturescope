import { describe, expect, it } from "vitest";

import { DATA_IMPORT_TEMPLATE } from "@/lib/data-import/catalog";
import {
  COLUMN_TITLES,
  describeColumns,
  describeMissingTitles,
  describeNoNumbers,
  normalizeTitle,
  readColumnTitles,
} from "@/lib/data-import/headers";

const E_ACUTE = String.fromCharCode(0xe9);

const CURLY_APOSTROPHE = String.fromCharCode(0x2019);

const ACUTE_MARK = String.fromCharCode(0x301);

const words = (text: string) => text.split(" ");

/** The titles that are read, written out again here so that a change of the list shows in a test. */
const EXPECTED = {
  ACTUALS: {
    period: words("month period date mois periode"),
    revenue: words(
      "revenue sales revenu revenus ventes chiffredaffaires chiffredaffairesht ca caht",
    ),
    cogs: words(
      "cogs costofgoodssold costofsales coutdesventes coutsdesventes coutdesmarchandisesvendues coutdachatdesmarchandisesvendues achatsconsommes",
    ),
    operatingExpenses: words(
      "operatingexpenses opex expenses chargesdexploitation chargesexploitation chargesoperationnelles depensesdexploitation depensesoperationnelles",
    ),
    ebitda: words("ebitda ebe excedentbrutdexploitation"),
    netIncome: words("netincome netprofit resultatnet beneficenet"),
    cashFlow: words(
      "cashflow netcashflow fluxdetresorerie fluxnetdetresorerie variationdetresorerie",
    ),
    cashBalance: words("cashbalance endingcash soldedetresorerie tresorerie tresoreriefinale"),
    mrr: words("mrr monthlyrecurringrevenue revenurecurrentmensuel revenusrecurrentsmensuels"),
    customers: words("customers activecustomers clients clientsactifs nombredeclients"),
  },
  KPI_TARGETS: {
    periodKey: words("periodkey period month date mois periode"),
    metricCode: words("metriccode metric kpi kpicode indicateur codeindicateur"),
    targetValue: words("targetvalue target objectif cible valeurcible valeurobjectif"),
    ownerName: words("ownername owner responsable proprietaire"),
    note: words("note notes comment comments commentaire remarque"),
  },
  VARIANCE_COMMENTARY: {
    periodKey: words("periodkey period month date mois periode"),
    metricCode: words("metriccode metric kpi kpicode indicateur codeindicateur"),
    causeCode: words("causecode cause codecause"),
    varianceNature: words("variancenature nature natureecart"),
    explanation: words("explanation explication comment commentary commentaire"),
    correctiveAction: words("correctiveaction action actioncorrective"),
    ownerName: words("ownername owner responsable proprietaire"),
    recoveryPeriodKey: words(
      "recoveryperiodkey recoveryperiod recoverymonth moisderecuperation periodederecuperation",
    ),
    status: words("status statut"),
  },
} as const;

const TYPES = ["ACTUALS", "KPI_TARGETS", "VARIANCE_COMMENTARY"] as const;

function messageOf(type: (typeof TYPES)[number], titles: string[]): string {
  try {
    readColumnTitles(type, titles);
  } catch (cause) {
    return cause instanceof Error ? cause.message : "not an error";
  }

  return "no error";
}

describe("normalizeTitle", () => {
  it("makes titles the same when only the way of writing is different", () => {
    const pairs: [string, string][] = [
      ["Operating Expenses", "operatingexpenses"],
      ["operating_expenses", "operatingexpenses"],
      ["operatingExpenses", "operatingexpenses"],
      ["Net income", "netincome"],
      ["PERIOD-KEY", "periodkey"],
      ["  Period Key  ", "periodkey"],
      ["Chiffre d'affaires", "chiffredaffaires"],
      [`Chiffre d${CURLY_APOSTROPHE}affaires`, "chiffredaffaires"],
      [`P${E_ACUTE}riode`, "periode"],
      [`D${E_ACUTE}penses d'exploitation`, "depensesdexploitation"],
      [`e${ACUTE_MARK}`, "e"],
      ["MRR (monthly)", "mrrmonthly"],
      ["???", ""],
      ["", ""],
    ];

    for (const [title, expected] of pairs) {
      expect(normalizeTitle(title), JSON.stringify(title)).toBe(expected);
    }
  });
});

describe("the list of titles", () => {
  it("is the one that the tests expect", () => {
    expect(COLUMN_TITLES).toEqual(EXPECTED);
  });

  it("holds the title of the template for every field", () => {
    for (const type of TYPES) {
      for (const [field, titles] of Object.entries(COLUMN_TITLES[type])) {
        expect(titles, `${type} ${field}`).toContain(normalizeTitle(field));
      }
    }
  });

  it("never gives one title to two fields of one file", () => {
    for (const type of TYPES) {
      const all = Object.values(COLUMN_TITLES[type]).flat();

      expect(new Set(all).size, type).toBe(all.length);
    }
  });

  it("is made of plain lower case letters and digits", () => {
    for (const type of TYPES) {
      for (const title of Object.values(COLUMN_TITLES[type]).flat()) {
        expect(title).toBe(normalizeTitle(title));

        expect(title).not.toBe("");
      }
    }
  });

  it("reads every title of the list as its field, in every way of writing it", () => {
    for (const type of TYPES) {
      for (const [field, titles] of Object.entries(EXPECTED[type])) {
        for (const title of titles) {
          const spaced = title.toUpperCase().split("").join(" ");

          for (const written of [title, spaced, `${title}_`]) {
            expect(readColumnTitles(type, [written]).fields, `${type} ${written}`).toEqual([field]);
          }
        }
      }
    }
  });

  it("reads the titles of the three templates as themselves", () => {
    for (const type of TYPES) {
      const titles = DATA_IMPORT_TEMPLATE[type].split("\n")[0].split(",");

      const read = readColumnTitles(type, titles);

      expect(read.fields, type).toEqual(titles);

      expect(read.renamed, type).toEqual([]);

      expect(read.ignored, type).toEqual([]);
    }
  });
});

describe("readColumnTitles", () => {
  it("reads capitals, spaces and accents, and tells which titles were read with other text", () => {
    const read = readColumnTitles("ACTUALS", [
      "Period",
      "Operating Expenses",
      `R${E_ACUTE}sultat net`,
    ]);

    expect(read.fields).toEqual(["period", "operatingExpenses", "netIncome"]);

    expect(read.renamed).toEqual([
      { title: "Operating Expenses", field: "operatingExpenses" },
      { title: `R${E_ACUTE}sultat net`, field: "netIncome" },
    ]);

    expect(read.ignored).toEqual([]);
  });

  it("does not call a title renamed when it is the field itself or has other capital letters", () => {
    expect(readColumnTitles("ACTUALS", ["period", "revenue"]).renamed).toEqual([]);

    const read = readColumnTitles("ACTUALS", ["PERIOD", "Revenue", "operatingexpenses"]);

    expect(read.fields).toEqual(["period", "revenue", "operatingExpenses"]);

    expect(read.renamed).toEqual([]);
  });

  it("keeps a title that is not known and says it is not used", () => {
    const read = readColumnTitles("ACTUALS", ["period", "Revenue", "Foo bar"]);

    expect(read.fields).toEqual(["period", "revenue", "Foo bar"]);

    expect(read.ignored).toEqual(["Foo bar"]);
  });

  it("lists the renamed titles in the order of the file", () => {
    const read = readColumnTitles("ACTUALS", ["Ventes", "Mois"]);

    expect(read.renamed).toEqual([
      { title: "Ventes", field: "revenue" },
      { title: "Mois", field: "period" },
    ]);
  });

  it("uses the title of the template when two columns are the same field", () => {
    const read = readColumnTitles("ACTUALS", ["Month", "period", "revenue"]);

    expect(read.fields).toEqual(["Month", "period", "revenue"]);

    expect(read.ignored).toEqual(["Month"]);

    expect(read.renamed).toEqual([]);
  });

  it("uses the first title of the list when no column has the title of the template", () => {
    const read = readColumnTitles("ACTUALS", ["Date", "Month", "revenue"]);

    expect(read.fields).toEqual(["Date", "period", "revenue"]);

    expect(read.ignored).toEqual(["Date"]);

    expect(read.renamed).toEqual([{ title: "Month", field: "period" }]);
  });

  it("refuses two columns with the same title once the way of writing is ignored", () => {
    for (const titles of [
      ["period", "Period"],
      ["Month", "month "],
      ["revenue", "period", "PERIOD"],
    ]) {
      const pair = titles.filter((title) => normalizeTitle(title) !== "revenue");

      expect(messageOf("ACTUALS", titles)).toBe(
        `Two columns are read as "period": "${pair[0]}" and "${pair[1]}". Keep only one of them.`,
      );
    }
  });

  it("names the field with its own spelling in that message", () => {
    expect(messageOf("KPI_TARGETS", ["Period Key", "periodKey"])).toBe(
      'Two columns are read as "periodKey": "Period Key" and "periodKey". Keep only one of them.',
    );

    expect(messageOf("ACTUALS", ["Net income", "NET_INCOME"])).toBe(
      'Two columns are read as "netIncome": "Net income" and "NET_INCOME". Keep only one of them.',
    );
  });

  it("reads the same word as the field of the file that it is in", () => {
    expect(readColumnTitles("KPI_TARGETS", ["Comment"]).fields).toEqual(["note"]);

    expect(readColumnTitles("VARIANCE_COMMENTARY", ["Comment"]).fields).toEqual(["explanation"]);
  });

  it("reads the three kinds of file", () => {
    expect(
      readColumnTitles("KPI_TARGETS", ["Period Key", "Metric Code", "Target Value", "Owner"])
        .fields,
    ).toEqual(["periodKey", "metricCode", "targetValue", "ownerName"]);

    expect(
      readColumnTitles("VARIANCE_COMMENTARY", [
        "Mois",
        "KPI",
        "Cause",
        "Nature",
        "Explication",
        "Action",
        "Responsable",
        "Recovery Month",
        "Statut",
      ]).fields,
    ).toEqual([
      "periodKey",
      "metricCode",
      "causeCode",
      "varianceNature",
      "explanation",
      "correctiveAction",
      "ownerName",
      "recoveryPeriodKey",
      "status",
    ]);
  });

  it("does not take a title of another file type or a name of the language itself", () => {
    expect(readColumnTitles("ACTUALS", ["targetValue", "constructor", "toString"]).ignored).toEqual(
      ["targetValue", "constructor", "toString"],
    );
  });

  it("works for no titles", () => {
    expect(readColumnTitles("ACTUALS", [])).toEqual({ fields: [], renamed: [], ignored: [] });
  });
});

describe("describeMissingTitles", () => {
  it("keeps the old first sentence and tells the other titles that are read", () => {
    expect(describeMissingTitles("ACTUALS", ["period"])).toBe(
      "Missing required CSV headers: period. Other titles that are read: period = month, date, mois, periode.",
    );

    expect(describeMissingTitles("KPI_TARGETS", ["metricCode", "targetValue"])).toBe(
      "Missing required CSV headers: metricCode, targetValue. Other titles that are read: metricCode = metric, kpi, kpicode, indicateur, codeindicateur; targetValue = target, objectif, cible, valeurcible, valeurobjectif.",
    );
  });
});

describe("describeNoNumbers", () => {
  it("says nothing for the files that are not Actuals", () => {
    expect(describeNoNumbers("KPI_TARGETS", ["periodKey"])).toBeNull();

    expect(describeNoNumbers("VARIANCE_COMMENTARY", [])).toBeNull();
  });

  it("asks for a column with numbers when an Actuals file has none", () => {
    const expected =
      "No column with numbers was found. Use at least one of these titles: revenue, cogs, operatingExpenses, ebitda, netIncome, cashFlow, cashBalance, mrr, customers.";

    expect(describeNoNumbers("ACTUALS", ["period", "Foo"])).toBe(expected);

    expect(describeNoNumbers("ACTUALS", [])).toBe(expected);

    expect(describeNoNumbers("ACTUALS", ["period", "targetValue", "constructor"])).toBe(expected);
  });

  it("says nothing when any one column with numbers is there", () => {
    for (const field of Object.keys(COLUMN_TITLES.ACTUALS).filter((name) => name !== "period")) {
      expect(describeNoNumbers("ACTUALS", ["period", field]), field).toBeNull();
    }
  });
});

describe("describeColumns", () => {
  it("says nothing when every title is the title of the template", () => {
    expect(describeColumns([], [])).toBeNull();
  });

  it("tells the titles that were read with other text", () => {
    expect(
      describeColumns(
        [
          { title: "Mois", field: "period" },
          { title: "CA", field: "revenue" },
        ],
        [],
      ),
    ).toBe("Your column titles were read like this: Mois = period, CA = revenue.");
  });

  it("tells the columns that are not used", () => {
    expect(describeColumns([], ["Foo", "Bar"])).toBe("These columns are not used: Foo, Bar.");
  });

  it("tells both, one sentence after the other", () => {
    expect(describeColumns([{ title: "Mois", field: "period" }], ["Foo"])).toBe(
      "Your column titles were read like this: Mois = period. These columns are not used: Foo.",
    );
  });

  it("shows eight items and counts the others", () => {
    const names = ["a", "b", "c", "d", "e", "f", "g", "h"];

    expect(describeColumns([], names)).toBe("These columns are not used: a, b, c, d, e, f, g, h.");

    expect(describeColumns([], [...names, "i"])).toBe(
      "These columns are not used: a, b, c, d, e, f, g, h and 1 more.",
    );

    expect(describeColumns([], [...names, "i", "j", "k"])).toBe(
      "These columns are not used: a, b, c, d, e, f, g, h and 3 more.",
    );

    const renamed = [...names, "i", "j"].map((title) => ({ title, field: "period" }));

    expect(describeColumns(renamed, [])).toBe(
      "Your column titles were read like this: a = period, b = period, c = period, d = period, e = period, f = period, g = period, h = period and 2 more.",
    );
  });
});
