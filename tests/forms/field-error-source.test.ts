import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const readme = readFileSync("README.md", "utf8");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

/** The text without spaces and line breaks, with one kind of quote and no comma before a closing bracket. */
function squash(text: string): string {
  return text
    .replace(/\s+/g, "")
    .replace(/'/g, '"')
    .replace(/,([)}\]])/g, "$1");
}

type Problem = { line: number; text: string };

function parse(source: string, file: string): ts.SourceFile {
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);

  ts.forEachChild(node, (child: ts.Node) => walk(child, visit));
}

function isElement(node: ts.Node): node is ts.JsxOpeningElement | ts.JsxSelfClosingElement {
  return ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node);
}

/** The text of an attribute without spaces. An empty text means there is no such attribute. */
function attributeText(element: ts.JsxOpeningLikeElement, name: string): string {
  for (const attribute of element.attributes.properties) {
    if (ts.isJsxAttribute(attribute) && attribute.name.getText() === name) {
      return attribute.initializer ? squash(attribute.initializer.getText()) : "true";
    }
  }

  return "";
}

/** The text inside the braces of an attribute value, so `{id}` and `id` look the same. */
function withoutBraces(text: string): string {
  return text.replace(/^\{/, "").replace(/\}$/, "");
}

function isCallOf(node: ts.Node, name: string): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name
  );
}

/**
 * A red message of the size of a form message must have an `id`, so the box can point to it, or
 * `role="alert"`, so a screen reader says it at once. Big red numbers, small labels and bold status
 * words are not messages.
 */
function findLooseMessages(source: string, file: string): Problem[] {
  const tree = parse(source, file);

  const problems: Problem[] = [];

  walk(tree, (node) => {
    if (isElement(node) && node.tagName.getText() === "p") {
      const className = attributeText(node, "className");

      const looksLikeMessage =
        className.includes("text-destructive") &&
        className.includes("text-sm") &&
        className.includes("font-") === false;

      const named = attributeText(node, "id") !== "" || attributeText(node, "role") === '"alert"';

      if (looksLikeMessage && named === false) {
        problems.push({
          line: tree.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          text: "red message without id or role",
        });
      }
    }
  });

  return problems;
}

/**
 * Every `FieldError` needs a box (or a group) of the same file that points to it, and every box that
 * points to a message needs that message. They share the text of the id.
 */
function findUnpairedMessages(source: string, file: string): Problem[] {
  const tree = parse(source, file);

  const messages = new Map<string, number>();

  const pointers = new Map<string, number>();

  const lineOf = (node: ts.Node) => tree.getLineAndCharacterOfPosition(node.getStart()).line + 1;

  walk(tree, (node) => {
    if (isElement(node) && node.tagName.getText() === "FieldError") {
      messages.set(withoutBraces(attributeText(node, "fieldId")), lineOf(node));
    }

    if (isCallOf(node, "fieldErrorProps") || isCallOf(node, "fieldErrorId")) {
      const first = node.arguments[0];

      if (first !== undefined) {
        pointers.set(squash(first.getText()), lineOf(node));
      }
    }
  });

  const problems: Problem[] = [];

  for (const [id, line] of messages) {
    if (pointers.has(id) === false) {
      problems.push({ line, text: `message ${id} is not pointed to by any box` });
    }
  }

  for (const [id, line] of pointers) {
    if (messages.has(id) === false) {
      problems.push({ line, text: `box ${id} points to a message that is not there` });
    }
  }

  return problems;
}

/**
 * A form that reads `state.errors` of `useActionState` must call `useFormErrorRecovery` with the
 * same errors and put the ref it returns on a `<form>`.
 */
function findFormsWithoutRecovery(source: string, file: string): Problem[] {
  const tree = parse(source, file);

  const lineOf = (node: ts.Node) => tree.getLineAndCharacterOfPosition(node.getStart()).line + 1;

  const states = new Map<string, number>();

  const hooks = new Map<string, string>();

  const formRefs = new Set<string>();

  const readNames = new Set<string>();

  walk(tree, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      isCallOf(node.initializer, "useActionState")
    ) {
      const pattern = node.name;

      if (ts.isArrayBindingPattern(pattern)) {
        const first = pattern.elements[0];

        if (first !== undefined && ts.isBindingElement(first) && ts.isIdentifier(first.name)) {
          states.set(first.name.text, lineOf(node));
        }
      }
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      isCallOf(node.initializer, "useFormErrorRecovery")
    ) {
      hooks.set(squash(node.initializer.arguments[0]?.getText() ?? ""), node.name.text);
    }

    if (ts.isPropertyAccessExpression(node) && node.name.text === "errors") {
      readNames.add(squash(node.getText()));
    }

    if (isElement(node) && node.tagName.getText() === "form") {
      formRefs.add(withoutBraces(attributeText(node, "ref")));
    }
  });

  const problems: Problem[] = [];

  for (const [name, line] of states) {
    const errors = `${name}.errors`;

    if (readNames.has(errors) === false) {
      continue;
    }

    const refName = hooks.get(errors);

    if (refName === undefined) {
      problems.push({
        line,
        text: `${errors} is read but useFormErrorRecovery(${errors}) is missing`,
      });
    } else if (formRefs.has(refName) === false) {
      problems.push({ line, text: `the ref ${refName} is not on a <form>` });
    }
  }

  return problems;
}

/** Every .tsx file of the app and its components, with a slash in the path on every system. */
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

const files = [...pageFiles("components"), ...pageFiles("app")];

function report(check: (source: string, file: string) => Problem[]): string[] {
  const found: string[] = [];

  for (const file of files) {
    for (const problem of check(readFileSync(file, "utf8"), file)) {
      found.push(`${file}:${problem.line} ${problem.text}`);
    }
  }

  return found;
}

describe("the check for red messages", () => {
  it("refuses a red message without an id or a role", () => {
    const source = `const a = <p className="text-sm text-destructive">Wrong</p>;`;

    expect(findLooseMessages(source, "a.tsx")).toEqual([
      { line: 1, text: "red message without id or role" },
    ]);
  });

  it("accepts a message with an id or with role alert", () => {
    const withId = `const a = <p id="x-error" className="mt-1 text-sm text-destructive">Wrong</p>;`;

    const withRole = `const a = <p role="alert" className="text-sm text-destructive">Wrong</p>;`;

    expect(findLooseMessages(withId, "a.tsx")).toEqual([]);

    expect(findLooseMessages(withRole, "a.tsx")).toEqual([]);
  });

  it("does not mind big red numbers, small labels and normal text", () => {
    expect(
      findLooseMessages(`const a = <p className="text-3xl text-destructive">5</p>;`, "a.tsx"),
    ).toEqual([]);

    expect(
      findLooseMessages(`const a = <p className="text-xs text-destructive">5</p>;`, "a.tsx"),
    ).toEqual([]);

    expect(
      findLooseMessages(`const a = <p className="text-sm text-muted-foreground">x</p>;`, "a.tsx"),
    ).toEqual([]);

    expect(
      findLooseMessages(`const a = <div className="text-sm text-destructive">x</div>;`, "a.tsx"),
    ).toEqual([]);
  });

  it("does not mind a bold status word", () => {
    const source = `const a = <p className="mt-1 text-sm font-semibold text-destructive">NOT READY</p>;`;

    expect(findLooseMessages(source, "a.tsx")).toEqual([]);
  });

  it("reports the line of the problem", () => {
    const source = `const a = (\n  <div>\n    <p className="text-sm text-destructive">x</p>\n  </div>\n);`;

    expect(findLooseMessages(source, "a.tsx")[0].line).toBe(3);
  });
});

describe("the check for boxes and messages", () => {
  it("accepts a box and a message with the same id", () => {
    const source = `const a = <div><Input id="n" {...fieldErrorProps("n", error)} /><FieldError fieldId="n" message={error} /></div>;`;

    expect(findUnpairedMessages(source, "a.tsx")).toEqual([]);
  });

  it("accepts ids that come from a variable or from a template", () => {
    const variable = `const a = <div><Input id={id} {...fieldErrorProps(id, error)} /><FieldError fieldId={id} message={error} /></div>;`;

    const template =
      "const a = <div><Input {...fieldErrorProps(`rename-${projectId}`, e)} /><FieldError fieldId={`rename-${projectId}`} message={e} /></div>;";

    expect(findUnpairedMessages(variable, "a.tsx")).toEqual([]);

    expect(findUnpairedMessages(template, "a.tsx")).toEqual([]);
  });

  it("accepts a group that uses fieldErrorId", () => {
    const source = `const a = <div><div role="group" aria-describedby={fieldErrorId("g")} /><FieldError fieldId="g" message={e} /></div>;`;

    expect(findUnpairedMessages(source, "a.tsx")).toEqual([]);
  });

  it("refuses a message that no box points to", () => {
    const source = `const a = <FieldError fieldId="n" message={error} />;`;

    expect(findUnpairedMessages(source, "a.tsx").map((problem) => problem.text)).toEqual([
      'message "n" is not pointed to by any box',
    ]);
  });

  it("refuses a box that points to a message that is not there", () => {
    const source = `const a = <Input {...fieldErrorProps("n", error)} />;`;

    expect(findUnpairedMessages(source, "a.tsx").map((problem) => problem.text)).toEqual([
      'box "n" points to a message that is not there',
    ]);
  });

  it("refuses ids that are only almost the same", () => {
    const source = `const a = <div><Input {...fieldErrorProps("name", e)} /><FieldError fieldId="names" message={e} /></div>;`;

    expect(findUnpairedMessages(source, "a.tsx")).toHaveLength(2);
  });
});

describe("the check for the recovery hook", () => {
  const good = `
    function Form() {
      const [state, action] = useActionState(save, {});
      const formRef = useFormErrorRecovery(state.errors);
      return <form ref={formRef} action={action}>{state.errors?.name?.[0]}</form>;
    }
  `;

  it("accepts a form with the hook and the ref", () => {
    expect(findFormsWithoutRecovery(good, "a.tsx")).toEqual([]);
  });

  it("refuses a form that reads the errors and has no hook", () => {
    const source = `
      function Form() {
        const [state, action] = useActionState(save, {});
        return <form action={action}>{state.errors?.name?.[0]}</form>;
      }
    `;

    expect(findFormsWithoutRecovery(source, "a.tsx").map((problem) => problem.text)).toEqual([
      "state.errors is read but useFormErrorRecovery(state.errors) is missing",
    ]);
  });

  it("refuses a hook whose ref is not on a form", () => {
    const source = good.replace("<form ref={formRef}", "<form");

    expect(findFormsWithoutRecovery(source, "a.tsx").map((problem) => problem.text)).toEqual([
      "the ref formRef is not on a <form>",
    ]);
  });

  it("refuses a hook that gets the errors of another form", () => {
    const source = `
      function Form() {
        const [createState, createAction] = useActionState(create, {});
        const [editState, editAction] = useActionState(edit, {});
        const createRef = useFormErrorRecovery(createState.errors);
        return (
          <div>
            <form ref={createRef} action={createAction}>{createState.errors?.a?.[0]}</form>
            <form action={editAction}>{editState.errors?.a?.[0]}</form>
          </div>
        );
      }
    `;

    expect(findFormsWithoutRecovery(source, "a.tsx").map((problem) => problem.text)).toEqual([
      "editState.errors is read but useFormErrorRecovery(editState.errors) is missing",
    ]);
  });

  it("does not mind a form that never reads the errors", () => {
    const source = `
      function Form() {
        const [state, action] = useActionState(save, {});
        return <form action={action}>{state.message}</form>;
      }
    `;

    expect(findFormsWithoutRecovery(source, "a.tsx")).toEqual([]);
  });
});

describe("the forms of the app", () => {
  it("looks at many files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("has no red form message that a screen reader cannot link or announce", () => {
    expect(report(findLooseMessages)).toEqual([]);
  }, 30_000);

  it("has a box for every message and a message for every box", () => {
    expect(
      report(findUnpairedMessages).filter(
        (line) => line.startsWith("components/forms/field-error.tsx") === false,
      ),
    ).toEqual([]);
  }, 30_000);

  it("helps every form that shows messages from the server", () => {
    expect(report(findFormsWithoutRecovery)).toEqual([]);
  }, 30_000);

  it("uses FieldError in many forms", () => {
    const users = files.filter((file) => readFileSync(file, "utf8").includes("<FieldError"));

    expect(users.length).toBeGreaterThanOrEqual(11);
  });
});

describe("the new model form", () => {
  const wizard = squash(readFileSync("components/projects/create-project-wizard.tsx", "utf8"));

  it("goes back to step 1 when the server finds a mistake in a step 1 box", () => {
    expect(wizard).toContain('import{errorsBelongToStepOne}from"@/lib/projects/wizard-step";');

    expect(wizard).toContain("if(state.errors!==seenErrors){setSeenErrors(state.errors);");

    expect(wizard).toContain("if(errorsBelongToStepOne(state.errors)){setStep(1);}");
  });

  it("names the two groups of buttons and says which button is chosen", () => {
    expect(wizard).toContain('role="group"aria-labelledby="project-horizon-label"');

    expect(wizard).toContain('id="project-horizon-label"');

    expect(wizard).toContain('role="group"aria-label="Revenuemodel"');

    expect(wizard.split("aria-pressed={").length - 1).toBe(2);
  });

  it("points each group to its message with fieldErrorId", () => {
    expect(wizard).toContain('fieldErrorId("project-horizon")');

    expect(wizard).toContain('fieldErrorId("project-revenue-mode")');
  });

  it("does not give a group aria-invalid, which is not valid on a group", () => {
    expect(wizard).not.toContain('role="group"aria-invalid');
  });
});

describe("the helper files", () => {
  const hook = squash(readFileSync("components/forms/use-form-error-recovery.ts", "utf8"));

  const snapshot = readFileSync("lib/forms/form-snapshot.ts", "utf8");

  it("remembers the text when the form is sent and puts it back when messages arrive", () => {
    expect(hook).toContain('form.addEventListener("submit",remember);');

    expect(hook).toContain('form.removeEventListener("submit",remember);');

    expect(hook).toContain("typed.current=takeFormSnapshot(form);");

    expect(hook).toContain("restoreFormSnapshot(typed.current);");
  });

  it("puts the text back before it moves the cursor", () => {
    expect(hook.indexOf("restoreFormSnapshot(typed.current);")).toBeGreaterThan(-1);

    expect(hook.indexOf("restoreFormSnapshot(typed.current);")).toBeLessThan(
      hook.indexOf("focus()"),
    );
  });

  it("looks for the first box that is marked wrong, and only runs when there are messages", () => {
    expect(hook).toContain(
      "querySelector<HTMLElement>('[aria-invalid=\"true\"]')".replace(/'/g, '"'),
    );

    expect(hook).toContain("if(hasFieldErrors(errors)===false){return;}");

    expect(hook).toContain("},[errors]);");
  });

  it("never puts back a password, a hidden box or a file", () => {
    for (const type of ["hidden", "password", "file"]) {
      expect(snapshot).toContain(`"${type}",`);
    }
  });
});

describe("the help page and the README", () => {
  it("answers the question about a form with a mistake", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const item = group?.items.find((entry) => entry.id === "form-mistakes");

    expect(item?.question).toBe("What happens when I save a form and one box has a mistake?");

    expect(item?.answer).toHaveLength(2);

    expect(item?.answer[0]).toContain("moves the cursor to the first one");

    expect(item?.answer[0]).toContain("What you typed stays");

    expect(item?.answer[1]).toContain("takes you back to step 1");

    expect(item?.answer[1]).toContain("password");
  });

  it("puts the new question after the one about keyboards and screen readers", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const ids = (group?.items ?? []).map((entry) => entry.id);

    expect(ids.indexOf("keyboard-and-screen-readers")).toBeGreaterThan(-1);

    expect(ids.indexOf("form-mistakes")).toBe(ids.indexOf("keyboard-and-screen-readers") + 1);
  });

  it("has a README section that names the files and the test", () => {
    const section = readmeSection("Clear messages when a form has a mistake");

    expect(section).toContain("`components/forms/field-error.tsx`");

    expect(section).toContain("`lib/forms/field-errors.ts`");

    expect(section).toContain("`fieldErrorProps`");

    expect(section).toContain("`aria-invalid`");

    expect(section).toContain("`aria-describedby`");

    expect(section).toContain("`useFormErrorRecovery`");

    expect(section).toContain("`components/forms/use-form-error-recovery.ts`");

    expect(section).toContain("`lib/forms/form-snapshot.ts`");

    expect(section).toContain("`lib/projects/wizard-step.ts`");

    expect(section).toContain("`aria-pressed`");

    expect(section).toContain("`tests/forms/field-error-source.test.ts`");

    expect(section).toContain("the migration count stays at 17");
  });

  it("is placed before the section about downloading data", () => {
    expect(readme.indexOf("## Clear messages when a form has a mistake")).toBeGreaterThan(-1);

    expect(readme.indexOf("## Clear messages when a form has a mistake")).toBeLessThan(
      readme.indexOf("## Download your data"),
    );
  });
});
