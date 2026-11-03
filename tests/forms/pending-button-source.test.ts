import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const button = read("components/forms/pending-button.tsx");

const governance = read("components/settings/model-governance.tsx");

const readme = read("README.md");

/** The text without spaces, line breaks and trailing commas, so the layout does not matter. */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when the squashed text contains the squashed piece. */
const has = (text: string, piece: string) => squash(text).includes(squash(piece));

/** The place of each marker in the squashed text, in the order they are given. */
function positions(text: string, markers: string[]): number[] {
  const body = squash(text);

  return markers.map((marker) => body.indexOf(squash(marker)));
}

/** True when every value was found and each one comes after the one before it. */
function isIncreasing(values: number[]): boolean {
  return values.every((value, index) => value > -1 && (index === 0 || value > values[index - 1]));
}

/** The part of the README that belongs to one "## " heading. */
function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

/** These pages use the PendingButton, and how many times each one does. */
const PENDING_BUTTON_USERS: [string, number][] = [
  ["components/approvals/approval-center.tsx", 4],
  ["components/variance-review/variance-review-workspace.tsx", 1],
  ["components/data-import/data-import-workbench.tsx", 1],
  ["components/risk-center/risk-center-workspace.tsx", 1],
  ["components/scorecard/scorecard-workspace.tsx", 1],
  ["components/planning-cycle/planning-cycle-workspace.tsx", 1],
  ["components/decision-center/decision-center-workspace.tsx", 2],
  ["components/actuals/actuals-variance-workspace.tsx", 2],
  ["components/consolidation/consolidation-workspace.tsx", 2],
  ["components/period-close/period-close-workspace.tsx", 2],
  ["components/alerts/alert-inbox-workspace.tsx", 2],
  ["components/board-room/board-room-workspace.tsx", 1],
  ["app/(app)/projects/[projectId]/versions/page.tsx", 2],
];

/** The sign out form leaves the page when it is done, so it needs no spinner. */
const NO_SPINNER_NEEDED = ["components/app/logout-button.tsx"];

/** The dialogs where the delete or reset button is a SubmitButton, and the words it shows. */
const SUBMIT_BUTTON_USERS: [string, string[]][] = [
  ["components/settings/model-governance.tsx", ["Working..."]],
  ["components/scenarios/scenario-manager.tsx", ["Resetting...", "Deleting..."]],
  ["components/financing/financing-event-actions.tsx", ["Deleting..."]],
  ["components/overrides/monthly-override-actions.tsx", ["Deleting..."]],
];

/** Every .tsx file of the app, with a slash in the path on every system. */
function appFiles(): string[] {
  return ["components", "app"]
    .flatMap((folder) =>
      readdirSync(folder, { recursive: true, encoding: "utf8" })
        .filter((name) => name.endsWith(".tsx"))
        .map((name) => join(folder, name).split("\\").join("/")),
    )
    .sort();
}

type ActionForm = {
  file: string;

  /** The opening tag, for example the one with action={saveAction}. */
  tag: string;

  /** Everything between the opening tag and the closing tag. */
  body: string;

  /** The whole file, without comments. */
  source: string;
};

/** Every form with an action, so not a filter form that only changes the address. */
function actionForms(): ActionForm[] {
  const found: ActionForm[] = [];

  for (const file of appFiles()) {
    const source = read(file).replace(/\/\*[\s\S]*?\*\//g, "");

    for (const match of source.matchAll(/<form\b(?:[^>]|=>)*>/g)) {
      const end = source.indexOf("</form>", match.index + match[0].length);

      if (end === -1 || /\baction=\{/.test(match[0]) === false) {
        continue;
      }

      found.push({
        file,
        tag: match[0],
        body: source.slice(match.index + match[0].length, end),
        source,
      });
    }
  }

  return found;
}

describe("the PendingButton", () => {
  it("is a client component that reads the status of its form", () => {
    expect(button.startsWith('"use client";')).toBe(true);

    expect(has(button, 'import { useFormStatus } from "react-dom";')).toBe(true);

    expect(has(button, "const { pending } = useFormStatus();")).toBe(true);

    expect(has(button, 'import { LoaderCircle } from "lucide-react";')).toBe(true);

    expect(
      has(button, "export function PendingButton({ children, className, disabled, ...props }"),
    ).toBe(true);
  });

  it("is always a submit button and cannot be pressed again while it works", () => {
    expect(has(button, '<button {...props} type="submit"')).toBe(true);

    expect(has(button, "disabled={disabled === true || pending}")).toBe(true);

    expect(has(button, "aria-busy={pending || undefined}")).toBe(true);
  });

  it("does not let a caller change the type or switch the lock off", () => {
    expect(
      isIncreasing(
        positions(button, [
          "{...props}",
          'type="submit"',
          "disabled={",
          "aria-busy={",
          "className={cn(",
        ]),
      ),
    ).toBe(true);

    expect(
      has(button, 'type PendingButtonProps = Omit<React.ComponentProps<"button">, "type">;'),
    ).toBe(true);
  });

  it("keeps the look it is given and only adds a height for touch and a look for busy", () => {
    expect(
      has(
        button,
        'className={cn("touch-target aria-busy:cursor-progress aria-busy:opacity-60", className)}',
      ),
    ).toBe(true);

    expect(has(button, "inline-flex")).toBe(false);
  });

  it("shows a hidden spinner before the label and stops the turning for reduced motion", () => {
    expect(
      has(
        button,
        '{pending ? (<LoaderCircle className="mr-2 inline-block size-3.5 animate-spin align-middle motion-reduce:animate-none" aria-hidden="true" />) : null}',
      ),
    ).toBe(true);

    expect(isIncreasing(positions(button, ["<LoaderCircle", "{children}", "</button>"]))).toBe(
      true,
    );
  });
});

describe("the buttons that send a form", () => {
  for (const [file, count] of PENDING_BUTTON_USERS) {
    it(`${file} uses the PendingButton ${count} time${count === 1 ? "" : "s"}`, () => {
      const text = read(file);

      expect(text.match(/<PendingButton\b/g)?.length ?? 0).toBe(count);

      expect(text.match(/<\/PendingButton>/g)?.length ?? 0).toBe(count);

      expect(/<PendingButton\b(?:[^>]|=>)*\btype=/.test(text)).toBe(false);

      expect(has(text, 'import { PendingButton } from "@/components/forms/pending-button";')).toBe(
        true,
      );
    });
  }

  it("changes 22 buttons in all", () => {
    expect(PENDING_BUTTON_USERS.reduce((sum, [, count]) => sum + count, 0)).toBe(22);
  });

  it("puts every PendingButton inside a form that has an action", () => {
    let seen = 0;

    for (const file of appFiles()) {
      const source = read(file).replace(/\/\*[\s\S]*?\*\//g, "");

      for (const match of source.matchAll(/<PendingButton\b/g)) {
        seen += 1;

        const open = source.lastIndexOf("<form", match.index);

        const closed = source.lastIndexOf("</form>", match.index);

        expect(open > closed, `${file} has a PendingButton outside a form`).toBe(true);

        const tag = /<form\b(?:[^>]|=>)*>/.exec(source.slice(open))?.[0] ?? "";

        expect(
          /\baction=\{/.test(tag),
          `${file} has a PendingButton in a form without an action`,
        ).toBe(true);
      }
    }

    expect(seen).toBe(22);
  });

  for (const [file, labels] of SUBMIT_BUTTON_USERS) {
    it(`${file} uses the SubmitButton for ${labels.join(" and ")}`, () => {
      const text = read(file);

      expect(has(text, 'import { SubmitButton } from "@/components/forms/submit-button";')).toBe(
        true,
      );

      expect(text.match(/<SubmitButton\b/g)?.length ?? 0).toBe(labels.length);

      expect(text.match(/<\/SubmitButton>/g)?.length ?? 0).toBe(labels.length);

      for (const label of labels) {
        expect(text.includes(`pendingLabel="${label}"`), `${file} lacks ${label}`).toBe(true);
      }

      expect(has(text, '<Button type="submit"')).toBe(false);
    });
  }
});

describe("every form that has an action", () => {
  const forms = actionForms();

  it("is found in the whole app", () => {
    expect(forms.length).toBeGreaterThan(50);
  });

  it("has no plain submit button, because that button gives no sign that it is working", () => {
    const plain = forms
      .filter((form) => /<button\b(?:[^>]|=>)*\btype="submit"/.test(form.body))
      .map((form) => form.file);

    expect(plain).toEqual([]);
  });

  it("shows that it is working", () => {
    const silent = forms
      .filter(
        (form) =>
          NO_SPINNER_NEEDED.includes(form.file) === false &&
          /<(?:Pending|\w*Submit|\w*Save)Button\b/.test(form.body) === false &&
          /<AlertDialogAction\s+asChild\b/.test(form.body) === false,
      )
      .map((form) => form.file);

    expect(silent).toEqual([]);
  });

  it("may skip the spinner only when the dialog closes at the first click", () => {
    const closing = forms.filter((form) => /<AlertDialogAction\s+asChild\b/.test(form.body));

    expect(closing.length).toBeGreaterThan(1);

    for (const form of closing) {
      expect(form.body.includes('type="submit"'), `${form.file} has no submit button`).toBe(true);
    }
  });

  it("still needs the sign out exception", () => {
    for (const file of NO_SPINNER_NEEDED) {
      expect(
        forms.some((form) => form.file === file),
        `${file} has no form with an action any more`,
      ).toBe(true);
    }
  });
});

describe("the help page and the README", () => {
  it("explains the spinner in the first group of the help page", () => {
    const group = HELP_GROUPS.find((entry) => entry.id === "getting-started");

    const item = group?.items.find((entry) => entry.id === "button-spinner");

    expect(item?.question).toBe(
      "Why does a button show a spinner and stop working after I press it?",
    );

    expect(item?.answer).toEqual([
      "Buttons such as Save, Import, Approve or Close period need a moment to finish. While they work, the button shows a small spinner and is switched off. This way a second click cannot send the same action twice.",
      "Wait until the button is ready again. The page then shows the result. If nothing changes for a long time, load the page again and check if your change was saved before you try again.",
    ]);

    const answer = (item?.answer ?? []).join(" ");

    expect(answer).toContain("a second click cannot send the same action twice");

    expect(answer).toContain("Wait until the button is ready again.");
  });

  it("has a README section that names the component, the dialogs and the test", () => {
    const section = readmeSection("Buttons that show they are working");

    expect(section).toContain("`components/forms/pending-button.tsx`");

    expect(section).toContain("`aria-busy`");

    expect(section).toContain("`SubmitButton`");

    expect(section).toContain('`method="get"`');

    expect(section).toContain("`tests/forms/pending-button-source.test.ts`");

    expect(section).toContain("the migration count stays at 17");

    const plain = section.replace(/\s+/g, " ");

    expect(plain).toContain(
      "The spinner stops turning for people who ask their system for less motion.",
    );

    expect(plain).toContain(
      "Only the sign out form and the dialogs that close at the first click are left out.",
    );

    expect(plain).toContain(
      'a form with an action that has a plain `<button type="submit">`, or that has no `PendingButton` or `SubmitButton`, fails',
    );

    expect(plain).toContain(
      "A button that sends a form must show that it is working, and it must not be pressed twice.",
    );

    expect(plain).toContain(
      "the buttons of the approval, period close, alert, decision, consolidation, actuals, data import, risk, scorecard, planning, board room, variance and version pages.",
    );

    expect(plain).toContain("It keeps the look you give it with `className`.");

    expect(plain).toContain("While the action runs, it shows a small spinner,");

    expect(plain).toContain(
      "The delete and reset buttons of the dialogs for scenarios, financing events, monthly overrides and the model settings use `SubmitButton`.",
    );
  });
});
