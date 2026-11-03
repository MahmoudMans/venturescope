import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

/** The text without spaces and line breaks, with no comma before a closing bracket. */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when every piece is found and each one comes after the one before it. */
function inOrder(text: string, pieces: string[]): boolean {
  const body = squash(text);

  let from = 0;

  for (const piece of pieces) {
    const at = body.indexOf(squash(piece), from);

    if (at === -1) {
      return false;
    }

    from = at + 1;
  }

  return true;
}

const SAVE_FORMS = [
  "components/assumptions/general-assumptions-form.tsx",
  "components/assumptions/revenue-assumptions-form.tsx",
  "components/assumptions/expense-assumptions-form.tsx",
  "components/settings/project-settings-form.tsx",
];

describe("the forms that are protected", () => {
  it("are the three assumptions forms and the project settings form", () => {
    const found = readdirSync("components/assumptions")
      .filter((name) => name.endsWith("-assumptions-form.tsx"))
      .map((name) => `components/assumptions/${name}`);

    expect(found.sort()).toEqual(SAVE_FORMS.slice(0, 3).sort());
  });

  it("use the hook with the form ref and the state of a save that worked", () => {
    for (const path of SAVE_FORMS) {
      const text = read(path);

      expect(text, path).toContain(
        'import { useUnsavedChangesWarning } from "@/components/forms/use-unsaved-changes-warning";',
      );

      expect(
        inOrder(text, [
          "const formRef = useFormErrorRecovery(state.errors);",
          'const dirty = useUnsavedChangesWarning(formRef, state.status === "success" ? state : null);',
        ]),
        path,
      ).toBe(true);
    }
  });

  it("show the note in the footer, before the save button", () => {
    const buttons = [
      "<AssumptionSaveButton",
      "<AssumptionSaveButton",
      "<AssumptionSaveButton",
      "<SettingsSubmitButton",
    ];

    SAVE_FORMS.forEach((path, index) => {
      const text = read(path);

      expect(text, path).toContain(
        'import { UnsavedChangesNotice } from "@/components/forms/unsaved-changes-notice";',
      );

      expect(
        inOrder(text, ["<CardFooter", "<UnsavedChangesNotice dirty={dirty} />", buttons[index]]),
        path,
      ).toBe(true);
    });
  });

  it("let the footer wrap, so the note has a line of its own on a phone", () => {
    for (const path of SAVE_FORMS) {
      expect(read(path), path).toContain(
        '<CardFooter className="flex-wrap justify-end gap-3 border-t py-5">',
      );
    }
  });

  it("are all the forms with a save button in the footer of a card", () => {
    const files = [
      ...readdirSync("components/assumptions").map((name) => `components/assumptions/${name}`),
      ...readdirSync("components/settings").map((name) => `components/settings/${name}`),
    ].filter((path) => path.endsWith(".tsx"));

    const withSave = files.filter((path) => {
      const text = read(path);

      return text.includes("<CardFooter") && text.includes("useActionState");
    });

    expect(withSave.sort()).toEqual([...SAVE_FORMS].sort());
  });
});

describe("the hook and the guard", () => {
  const hook = read("components/forms/use-unsaved-changes-warning.ts");

  const guard = read("lib/forms/leave-guard.ts");

  it("is a client hook that starts the guard with the form and ends it with the form", () => {
    expect(hook.startsWith('"use client";')).toBe(true);

    expect(hook).toContain("const owner = useRef({});");

    expect(
      inOrder(hook, [
        "const release = installLeaveGuard();",
        "const started = trackUnsavedChanges(form, {",
        "return () => {",
        "started.stop();",
        "markUnsaved(key, false);",
        "release();",
      ]),
    ).toBe(true);
  });

  it("changes its state only from the tracker, never inside an effect body", () => {
    expect(hook.match(/setDirty\(/g)?.length).toBe(1);

    expect(
      inOrder(hook, ["onChange: (next) => {", "markUnsaved(key, next);", "setDirty(next);"]),
    ).toBe(true);
  });

  it("does nothing for a save that did not work", () => {
    expect(
      inOrder(hook, ["if (savedAt === null || savedAt === undefined) {", "return;", "}"]),
    ).toBe(true);

    expect(hook).toContain("}, [savedAt]);");
  });

  it("catches clicks in the capture phase and the closing of the tab", () => {
    expect(guard).toContain('doc.addEventListener("click", onClick, true);');

    expect(guard).toContain('doc.removeEventListener("click", onClick, true);');

    expect(guard).toContain('win.addEventListener("beforeunload", onBeforeUnload);');

    expect(guard).toContain('win.removeEventListener("beforeunload", onBeforeUnload);');
  });

  it("stops the click completely when the person stays", () => {
    expect(
      inOrder(guard, [
        "if (confirmDiscardChanges(win.confirm.bind(win), now) === false) {",
        "event.preventDefault();",
        "event.stopPropagation();",
      ]),
    ).toBe(true);
  });

  it("asks the browser to ask, with an empty return value", () => {
    expect(inOrder(guard, ["event.preventDefault();", 'event.returnValue = "";'])).toBe(true);
  });
});

describe("the search bar", () => {
  const palette = read("components/app/command-palette.tsx");

  it("asks before it opens a page, and stays open when the person stays", () => {
    expect(palette).toContain('import { confirmDiscardChanges } from "@/lib/forms/leave-guard";');

    expect(
      inOrder(palette, [
        "function go(item: CommandPaletteItem) {",
        "if (confirmDiscardChanges() === false) {",
        "return;",
        "}",
        "changeOpen(false);",
        "router.push(item.href);",
      ]),
    ).toBe(true);
  });

  it("lists each file that changes the page with code, so a new one is noticed and thought about", () => {
    const files: string[] = [];

    const walk = (folder: string) => {
      for (const entry of readdirSync(folder, { withFileTypes: true })) {
        const path = `${folder}/${entry.name}`;

        if (entry.isDirectory()) {
          walk(path);
        } else if (path.endsWith(".tsx") && read(path).includes("router.push(")) {
          files.push(path);
        }
      }
    };

    walk("components");

    walk("app");

    expect(files.sort()).toEqual([
      "components/app/command-palette.tsx",
      "components/scenarios/scenario-switcher.tsx",
    ]);
  });
});

describe("the help page and the README", () => {
  it("answers the question about leaving a page", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const item = group?.items.find((entry) => entry.id === "unsaved-changes");

    expect(item?.question).toBe("What happens if I leave a page before I save my changes?");

    expect(item?.answer).toHaveLength(2);

    expect(item?.answer[0]).toContain("You have unsaved changes");

    expect(item?.answer[0]).toContain("Ctrl+K");

    expect(item?.answer[0]).toContain("Choose to stay, then press Save.");

    expect(item?.answer[1]).toContain("Ctrl+S (Cmd+S on a Mac)");

    expect(item?.answer[1]).toContain(
      "The Back button of the browser is not checked, so save your changes before you use it.",
    );
  });

  it("puts the new question after the one about the colors", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const ids = (group?.items ?? []).map((entry) => entry.id);

    expect(ids.indexOf("high-contrast")).toBeGreaterThan(-1);

    expect(ids.indexOf("unsaved-changes")).toBe(ids.indexOf("high-contrast") + 1);
  });

  it("has a README section that names the files, the tests and the limits", () => {
    const section = readmeSection("Do not lose your work");

    for (const piece of [
      "`useUnsavedChangesWarning`",
      "`components/forms/use-unsaved-changes-warning.ts`",
      "`trackUnsavedChanges`",
      "`hiddenSignature`",
      "`markSaved()`",
      "`APP_LINK_QUIET_MS`",
      "`lib/forms/unsaved-changes.ts`",
      "`UnsavedChangesNotice`",
      "`installLeaveGuard`",
      "`lib/forms/leave-guard.ts`",
      "`confirmDiscardChanges()`",
      "`components/app/command-palette.tsx`",
      "`beforeunload`",
      "Ctrl+S",
      "Back button",
      "`tests/forms/unsaved-changes-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(section, piece).toContain(piece);
    }
  });
});
