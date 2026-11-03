import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { spokenUnit } from "@/lib/charts/chart-text";

/** The fields a person types in or picks from. A screen reader must be able to say what each one is for. */
const FIELD_TAGS = new Set([
  "input",
  "select",
  "textarea",
  "Input",
  "Textarea",
  "NativeSelect",
  "Checkbox",
  "Switch",
  "Slider",
  "SelectTrigger",
  "PasswordInput",
]);

/** These only pass their props on. The page that uses them gives the name. */
const WRAPPER_FILES = new Set([
  "components/ui/input.tsx",
  "components/forms/native-select.tsx",
  "components/auth/password-input.tsx",
]);

type Problem = { line: number; text: string };

function attributeNames(element: ts.JsxOpeningLikeElement): string[] {
  return element.attributes.properties.map((attribute: ts.JsxAttributeLike) =>
    ts.isJsxAttribute(attribute) ? attribute.name.getText() : "...",
  );
}

/** The text of an attribute without spaces and line breaks. An empty text means there is no such attribute. */
function attributeText(element: ts.JsxOpeningLikeElement, name: string): string {
  for (const attribute of element.attributes.properties) {
    if (ts.isJsxAttribute(attribute) && attribute.name.getText() === name) {
      return attribute.initializer ? attribute.initializer.getText().replace(/\s+/g, "") : "true";
    }
  }

  return "";
}

/** True when the attribute is there and is not an empty text. An empty name says nothing. */
function hasWords(element: ts.JsxOpeningLikeElement, name: string): boolean {
  const text = attributeText(element, name);

  return text !== "" && text !== '""' && text !== "''" && text !== "{''}" && text !== '{""}';
}

/**
 * Finds the fields that have no name for a screen reader, and the labels that name nothing.
 * A field has a name when a label wraps it, when it has `aria-label` or `aria-labelledby`, or when it
 * has an `id` and a label of the same file points to that `id` with `htmlFor`. A field the eyes cannot
 * see needs no name.
 */
function findProblems(source: string, file: string): Problem[] {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const problems: Problem[] = [];

  const linkedIds = new Set<string>();

  const collect = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const target = attributeText(node, "htmlFor");

      if (target !== "") {
        linkedIds.add(target);
      }
    }

    ts.forEachChild(node, collect);
  };

  collect(tree);

  const lineOf = (node: ts.Node) => tree.getLineAndCharacterOfPosition(node.getStart()).line + 1;

  const visit = (node: ts.Node, insideLabel: boolean) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === "label") {
      let wrapsField = false;

      const look = (child: ts.Node) => {
        if (
          (ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) &&
          FIELD_TAGS.has(child.tagName.getText())
        ) {
          wrapsField = true;
        }

        ts.forEachChild(child, look);
      };

      ts.forEachChild(node, look);

      if (
        wrapsField === false &&
        attributeNames(node.openingElement).includes("htmlFor") === false
      ) {
        problems.push({ line: lineOf(node), text: "label without a field" });
      }
    }

    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      FIELD_TAGS.has(node.tagName.getText())
    ) {
      const names = attributeNames(node);

      const invisible =
        names.includes("hidden") ||
        attributeText(node, "type") === '"hidden"' ||
        attributeText(node, "type") === "'hidden'";

      const named =
        insideLabel ||
        hasWords(node, "aria-label") ||
        hasWords(node, "aria-labelledby") ||
        (attributeText(node, "id") !== "" && linkedIds.has(attributeText(node, "id")));

      if (invisible === false && named === false) {
        problems.push({ line: lineOf(node), text: `<${node.tagName.getText()}> has no name` });
      }
    }

    const inside =
      insideLabel || (ts.isJsxElement(node) && node.openingElement.tagName.getText() === "label");

    ts.forEachChild(node, (child: ts.Node) => visit(child, inside));
  };

  visit(tree, false);

  return problems;
}

/** Every .tsx file of the app and its components, with the path from the project root. */
function pageFiles(folder: string): string[] {
  const found: string[] = [];

  for (const name of readdirSync(folder)) {
    const path = join(folder, name);

    if (statSync(path).isDirectory()) {
      found.push(...pageFiles(path));
    } else if (path.endsWith(".tsx")) {
      found.push(path.split("\\").join("/"));
    }
  }

  return found;
}

describe("the check for field names", () => {
  it("accepts a field inside a label", () => {
    const source = `const a = <label><span>Name</span><input name="a" /></label>;`;

    expect(findProblems(source, "a.tsx")).toEqual([]);
  });

  it("accepts aria-label and aria-labelledby", () => {
    expect(findProblems(`const a = <input aria-label="Name" />;`, "a.tsx")).toEqual([]);

    expect(findProblems(`const a = <select aria-labelledby="title" />;`, "a.tsx")).toEqual([]);
  });

  it("refuses an empty aria-label", () => {
    expect(findProblems(`const a = <input aria-label="" />;`, "a.tsx")).toHaveLength(1);

    expect(findProblems(`const a = <input aria-label={""} />;`, "a.tsx")).toHaveLength(1);

    expect(findProblems(`const a = <select aria-labelledby="" />;`, "a.tsx")).toHaveLength(1);
  });

  it("accepts an aria-label that comes from a variable", () => {
    expect(findProblems(`const a = <input aria-label={title} />;`, "a.tsx")).toEqual([]);
  });

  it("accepts an id when the file has a label with htmlFor", () => {
    const source = `const a = <div><label htmlFor="x">Name</label><input id="x" /></div>;`;

    expect(findProblems(source, "a.tsx")).toEqual([]);
  });

  it("accepts fields that nobody sees", () => {
    expect(findProblems(`const a = <input type="hidden" name="a" />;`, "a.tsx")).toEqual([]);

    expect(findProblems(`const a = <textarea hidden readOnly name="csv" />;`, "a.tsx")).toEqual([]);
  });

  it("refuses a field with only a placeholder", () => {
    const problems = findProblems(`const a = <input placeholder="Reason" />;`, "a.tsx");

    expect(problems).toEqual([{ line: 1, text: "<input> has no name" }]);
  });

  it("accepts the Label component and an id that comes from a variable", () => {
    const source = `const a = <div><Label htmlFor={fieldId}>Name</Label><Input id={fieldId} /></div>;`;

    expect(findProblems(source, "a.tsx")).toEqual([]);
  });

  it("does not mind the layout of the id and htmlFor values", () => {
    const source = `const a = <div><label htmlFor={\n  fieldId\n}>Name</label><input id={fieldId} /></div>;`;

    expect(findProblems(source, "a.tsx")).toEqual([]);
  });

  it("refuses an id when no label has htmlFor", () => {
    expect(findProblems(`const a = <input id="x" />;`, "a.tsx")).toHaveLength(1);
  });

  it("refuses an id when the label points to another id", () => {
    const source = `const a = <div><label htmlFor="y">Name</label><input id="x" /></div>;`;

    expect(findProblems(source, "a.tsx")).toEqual([{ line: 1, text: "<input> has no name" }]);
  });

  it("checks the password field like every other field", () => {
    expect(findProblems(`const a = <PasswordInput id="p" />;`, "a.tsx")).toHaveLength(1);

    const named = `const a = <div><Label htmlFor="p">Password</Label><PasswordInput id="p" /></div>;`;

    expect(findProblems(named, "a.tsx")).toEqual([]);
  });

  it("refuses a select, a textarea and the shared components without a name", () => {
    const source = `const a = <div><select /><textarea /><Input /><NativeSelect /></div>;`;

    expect(findProblems(source, "a.tsx").map((problem) => problem.text)).toEqual([
      "<select> has no name",
      "<textarea> has no name",
      "<Input> has no name",
      "<NativeSelect> has no name",
    ]);
  });

  it("refuses a label that has no field and no htmlFor", () => {
    const source = `const a = <div><label>Growth</label><input type="range" /></div>;`;

    const texts = findProblems(source, "a.tsx").map((problem) => problem.text);

    expect(texts).toContain("label without a field");

    expect(texts).toContain("<input> has no name");
  });

  it("refuses a field that is only next to a label", () => {
    const source = `const a = <div><label>Growth</label><select aria-hidden="true" /></div>;`;

    expect(findProblems(source, "a.tsx").length).toBeGreaterThan(0);
  });

  it("reports the line of the problem", () => {
    const source = `const a = (\n  <div>\n    <input />\n  </div>\n);`;

    expect(findProblems(source, "a.tsx")).toEqual([{ line: 3, text: "<input> has no name" }]);
  });
});

describe("the fields of the app", () => {
  const files = [...pageFiles("components"), ...pageFiles("app")].filter(
    (file) => WRAPPER_FILES.has(file) === false,
  );

  it("looks at many files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("gives every field a name that a screen reader can say", () => {
    const report: string[] = [];

    for (const file of files) {
      for (const problem of findProblems(readFileSync(file, "utf8"), file)) {
        report.push(`${file}:${problem.line} ${problem.text}`);
      }
    }

    expect(report).toEqual([]);
  }, 30_000);
});

describe("the fields that are repeated for each row of a list", () => {
  const squashed = (file: string) =>
    readFileSync(file, "utf8")
      .replace(/\s+/g, "")
      .replace(/,([)}\]])/g, "$1");

  it("tell a screen reader which month they belong to", () => {
    const body = squashed("components/period-close/period-close-workspace.tsx");

    expect(body).toContain("aria-label={`TypeCLOSE${row.periodKey}toconfirm`}");

    expect(body).toContain("aria-label={`TypeREOPEN${row.periodKey}toconfirm`}");
  });

  it("tell a screen reader which action they belong to", () => {
    const body = squashed("components/decision-center/decision-center-workspace.tsx");

    expect(body).toContain("aria-label={`Statusofaction:${action.title}`}");
  });
});

describe("the live simulator", () => {
  const simulator = readFileSync("components/scenarios/live-scenario-simulator.tsx", "utf8");

  const body = simulator.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

  it("links the label to the number box with a generated id", () => {
    expect(body).toContain("constfieldId=useId();");

    expect(body).toContain("<labelhtmlFor={fieldId}");

    expect(body).toContain('<inputid={fieldId}type="number"');
  });

  it("names the slider and says its value in words", () => {
    expect(body).toContain("aria-label={`${label},slider`}");

    expect(body).toContain("aria-valuetext={`${value}${spokenUnit(suffix)}`}");
  });

  it("uses the spoken unit of the shared words file", () => {
    expect(body).toContain(
      'import{buildRevenueTrajectoryText,spokenUnit}from"@/lib/charts/chart-text";',
    );

    expect(body).not.toContain("functionspokenUnit");
  });

  it("gives each slider a unit that has a spoken form", () => {
    const units = [...simulator.matchAll(/suffix="([^"]*)"/g)].map((found) => found[1]);

    expect(units.length).toBe(5);

    expect(units.every((unit) => spokenUnit(unit) !== unit)).toBe(true);
  });
});
