import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const css = read("app/globals.css");

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

type Block = { prelude: string; body: string };

/** The blocks of the CSS file that are not inside another block, so not inside an @layer. */
function topLevelBlocks(text: string): Block[] {
  const source = text.replace(/\/\*[\s\S]*?\*\//g, "");

  const blocks: Block[] = [];

  let depth = 0;

  let start = 0;

  let bodyStart = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      if (depth === 0) {
        bodyStart = index + 1;
      }

      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        blocks.push({
          prelude: source
            .slice(start, bodyStart - 1)
            .trim()
            .replace(/\s+/g, " "),
          body: source.slice(bodyStart, index),
        });

        start = index + 1;
      }
    } else if (char === ";" && depth === 0) {
      start = index + 1;
    }
  }

  return blocks;
}

function sourceFiles(folders: string[], endings: string[]): string[] {
  const files: string[] = [];

  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = `${folder}/${entry.name}`;

      if (entry.isDirectory()) {
        walk(path);
      } else if (endings.some((ending) => path.endsWith(ending))) {
        files.push(path);
      }
    }
  };

  for (const folder of folders) {
    walk(folder);
  }

  return files.sort();
}

/** Every file with pages and components of the app, except the shared Button and its friends. */
const files = sourceFiles(["app", "components"], [".tsx"]).filter(
  (file) => file.startsWith("components/ui/") === false,
);

/** The opening tags with this name, from the "<" to the ">" that closes the tag. */
function openingTags(text: string, names: string[]): string[] {
  const tags: string[] = [];

  const pattern = new RegExp(`<(${names.join("|")})(\\s)`, "g");

  for (const match of text.matchAll(pattern)) {
    let depth = 0;

    let index = match.index + match[0].length;

    while (index < text.length) {
      const char = text[index];

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      } else if (char === ">" && depth === 0 && text[index - 1] !== "=") {
        break;
      }

      index += 1;
    }

    tags.push(text.slice(match.index, index + 1));
  }

  return tags;
}

/** The words of the className text of a tag, or null when the class is not a plain text. */
function classWords(tag: string): string[] | null {
  const match = /className="([^"]*)"/.exec(tag);

  return match === null ? null : match[1].split(/\s+/).filter((word) => word !== "");
}

/** How many times a class appears in a text, as a whole word (touch-link is not touch-linker). */
function countWord(text: string, name: string): number {
  return text.split(/[^\w-]+/).filter((word) => word === name).length;
}

/** How many times the class appears in all the files. */
function countClass(name: string): number {
  let total = 0;

  for (const file of files) {
    total += countWord(read(file), name);
  }

  return total;
}

const touchBlocks = topLevelBlocks(css).filter(
  (block) => block.prelude === "@media (pointer: coarse)",
);

const linkRule = touchBlocks.find((block) => block.body.includes(".touch-link"))?.body ?? "";

describe("the rules for links on a touch screen", () => {
  it("are in a block for a touch screen, outside every @layer", () => {
    expect(linkRule).not.toBe("");

    for (const block of topLevelBlocks(css)) {
      if (block.prelude.startsWith("@layer")) {
        expect(block.body, block.prelude).not.toContain("touch-link");

        expect(block.body, block.prelude).not.toContain("touch-reach");
      }
    }
  });

  it("do not change a screen with a mouse", () => {
    const outside = topLevelBlocks(css).filter(
      (block) => block.prelude !== "@media (pointer: coarse)",
    );

    for (const block of outside) {
      expect(block.prelude + block.body, block.prelude).not.toContain("touch-link");

      expect(block.prelude + block.body, block.prelude).not.toContain("touch-reach");
    }
  });

  it("are not important, so one place can still choose another size on purpose", () => {
    expect(linkRule).not.toContain("important");
  });

  it("make a link that looks like a button 44px high and 44px wide, with the text in the middle", () => {
    expect(squash(linkRule)).toContain(
      squash(`.touch-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.75rem;
        min-width: 2.75rem;
      }`),
    );
  });

  it("give a text link a touch area from a ::after box, so the link does not move", () => {
    expect(squash(linkRule)).toContain(
      squash(`.touch-reach {
        position: relative;
      }`),
    );

    expect(squash(linkRule)).toContain(
      squash(`.touch-reach::after {
        content: "";
        position: absolute;
        inset-block: -1rem;
        inset-inline: -0.25rem;
      }`),
    );
  });

  it("make even a line of text of 12px a touch area of at least 44px", () => {
    const above = 1 * 16;

    const lineOfSmallText = 12;

    expect(above * 2 + lineOfSmallText).toBeGreaterThanOrEqual(44);
  });

  it("make the small logo, 36px wide, a touch area of at least 44px", () => {
    const beside = 0.25 * 16;

    const logoWidth = 36;

    expect(beside * 2 + logoWidth).toBeGreaterThanOrEqual(44);
  });
});

describe("a link that looks like a button", () => {
  it("has touch-link or touch-target when it has a border and some padding or a height of 40px", () => {
    const bad: string[] = [];

    let found = 0;

    for (const file of files) {
      for (const tag of openingTags(read(file), ["Link", "a"])) {
        const words = classWords(tag);

        if (words === null) {
          continue;
        }

        if (
          words.includes("border") &&
          (words.some((w) => w.startsWith("py-")) || words.includes("h-10"))
        ) {
          found += 1;

          // The 3 round links of the Help center had touch-target before touch-link was made.
          if (words.includes("touch-link") === false && words.includes("touch-target") === false) {
            bad.push(`${file}: ${words.join(" ")}`);
          }
        }
      }
    }

    expect(bad).toEqual([]);

    expect(found).toBe(42);
  });

  it("is the only kind of element that has touch-link, together with the two parts of the switch", () => {
    expect(countClass("touch-link")).toBe(42);

    for (const file of files) {
      for (const tag of openingTags(read(file), ["button", "Button"])) {
        expect(tag, file).not.toMatch(/\btouch-link\b/);
      }
    }
  });

  it("is never hidden on some screens, because touch-link would show it again", () => {
    const bad: string[] = [];

    for (const file of files) {
      for (const match of read(file).matchAll(/"([^"]*\btouch-link\b[^"]*)"/g)) {
        if (/(^| )(hidden|[a-z]+:hidden|max-[a-z]+:hidden)( |$)/.test(match[1])) {
          bad.push(`${file}: ${match[1]}`);
        }
      }
    }

    expect(bad).toEqual([]);
  });

  it("is used for the monthly and the annual switch of the forecast", () => {
    const text = read("components/financial/forecast-view-toggle.tsx");

    expect(text.match(/"touch-link rounded-md px-3 py-1\.5 text-xs font-medium/g)?.length).toBe(2);
  });
});

describe("a plain button", () => {
  // These buttons are big cards (a choice with a title and a text), well over 44px high.
  const bigCards: Record<string, number> = {
    "components/assumptions/expense-assumptions-form.tsx": 3,
    "components/projects/create-project-wizard.tsx": 2,
    "components/sensitivity-lab/sensitivity-lab-workspace.tsx": 1,
  };

  it("has touch-target, except the six big cards", () => {
    const unmarked: Record<string, number> = {};

    for (const file of files) {
      for (const tag of openingTags(read(file), ["button"])) {
        if (/\btouch-target\b/.test(tag) === false) {
          unmarked[file] = (unmarked[file] ?? 0) + 1;
        }
      }
    }

    expect(unmarked).toEqual(bigCards);
  });

  it("is marked 14 times: the 13 buttons of the pages and the PendingButton", () => {
    let marked = 0;

    for (const file of files) {
      for (const tag of openingTags(read(file), ["button"])) {
        if (/\btouch-target\b/.test(tag)) {
          marked += 1;
        }
      }
    }

    expect(marked).toBe(14);
  });

  it("is a big card of at least 44px when it is one of the six", () => {
    const expense = read("components/assumptions/expense-assumptions-form.tsx");

    expect(expense).toContain("rounded-xl border px-4 py-3 text-sm font-medium");

    expect(expense.match(/"rounded-xl border p-4 text-left"/g)?.length).toBe(2);

    const wizard = read("components/projects/create-project-wizard.tsx");

    expect(wizard).toContain("rounded-xl border px-3 py-4 text-center");

    expect(wizard).toContain("rounded-2xl border p-6 text-left");

    expect(read("components/sensitivity-lab/sensitivity-lab-workspace.tsx")).toContain(
      "block min-h-24 w-full p-3 text-left",
    );
  });
});

describe("PendingButton", () => {
  const text = read("components/forms/pending-button.tsx");

  it("has touch-target, so the 22 submit buttons that use it are 44px high on a phone", () => {
    expect(text).toContain(
      'cn("touch-target aria-busy:cursor-progress aria-busy:opacity-60", className)',
    );
  });

  it("is used by 22 submit buttons", () => {
    let uses = 0;

    for (const file of files) {
      uses += read(file).match(/<PendingButton[\s>]/g)?.length ?? 0;
    }

    expect(uses).toBe(22);
  });
});

describe("the links of the menus", () => {
  it("have touch-target in the side menu of the app and in the menu of a model", () => {
    expect(read("components/app/app-sidebar-nav.tsx")).toContain(
      '"touch-target group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors"',
    );

    expect(read("components/projects/project-workspace-nav.tsx")).toContain(
      '"touch-target flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors"',
    );
  });

  it("have no class in the menu of a phone, because a menu item is already 44px", () => {
    const text = read("components/app/mobile-nav.tsx");

    expect(text).toContain("<DropdownMenuItem asChild>");

    expect(text).not.toContain("touch-");
  });
});

describe("a text link", () => {
  const expected: Record<string, number> = {
    "app/(app)/projects/[projectId]/versions/page.tsx": 1,
    "app/(app)/workspaces/[workspaceId]/page.tsx": 2,
    "app/(marketing)/page.tsx": 3,
    "components/assumptions/revenue-assumptions-form.tsx": 1,
    "components/auth/login-form.tsx": 1,
    "components/auth/register-form.tsx": 1,
    "components/auth/reset-password-form.tsx": 1,
    "components/brand/venturescope-logo.tsx": 1,
    "components/dashboard/shared-models-section.tsx": 2,
    "components/projects/project-card.tsx": 2,
    "components/site/public-page-shell.tsx": 2,
  };

  it("has touch-reach in these files and no other", () => {
    const found: Record<string, number> = {};

    for (const file of files) {
      const count = countWord(read(file), "touch-reach");

      if (count > 0) {
        found[file] = count;
      }
    }

    expect(found).toEqual(expected);
  });

  it("never has touch-reach and another touch class together", () => {
    const bad: string[] = [];

    for (const file of files) {
      for (const match of read(file).matchAll(/"([^"]*\btouch-reach\b[^"]*)"/g)) {
        if (/\btouch-(link|target)\b/.test(match[1])) {
          bad.push(`${file}: ${match[1]}`);
        }
      }
    }

    expect(bad).toEqual([]);
  });

  it("is a block or an inline-block when it can wrap onto two lines", () => {
    expect(read("components/projects/project-card.tsx")).toContain(
      'className="touch-reach block break-words font-semibold tracking-tight hover:underline"',
    );

    const shared = read("components/dashboard/shared-models-section.tsx");

    expect(shared).toContain(
      'className="touch-reach block break-words font-semibold tracking-tight hover:underline"',
    );

    expect(shared).toContain('className="touch-reach inline-block hover:underline"');

    expect(read("app/(app)/workspaces/[workspaceId]/page.tsx")).toContain(
      'className="touch-reach block break-words text-sm font-medium hover:underline"',
    );
  });

  it("is on the three links under the sign-in, register and reset forms", () => {
    for (const file of [
      "components/auth/login-form.tsx",
      "components/auth/register-form.tsx",
      "components/auth/reset-password-form.tsx",
    ]) {
      expect(read(file), file).toContain(
        'className="touch-reach ml-1 font-medium text-foreground underline-offset-4 hover:underline"',
      );
    }
  });

  it("is on the header links of the public pages and of the home page", () => {
    const piece =
      'className="touch-reach text-sm text-muted-foreground transition-colors hover:text-foreground"';

    expect(read("components/site/public-page-shell.tsx").split(piece).length - 1).toBe(2);

    expect(read("app/(marketing)/page.tsx").split(piece).length - 1).toBe(3);
  });

  it("is on the box inside the logo link, and only when the logo is a link", () => {
    const text = read("components/brand/venturescope-logo.tsx");

    expect(squash(text)).toContain(
      squash(
        'className={cn("inline-flex items-center gap-2.5", href !== "" && "touch-reach", className)}',
      ),
    );
  });
});

describe("a link inside a sentence", () => {
  it("is not changed: it is exempt in WCAG 2.5.8, and two links on lines next to each other would overlap", () => {
    const layout = read("app/(app)/projects/[projectId]/layout.tsx");

    expect(layout).toContain('className="font-medium text-foreground hover:underline"');

    expect(layout).not.toContain("touch-");

    expect(read("components/site/contact-note.tsx")).not.toContain("touch-");

    expect(read("components/app/not-found-state.tsx")).not.toContain("touch-");
  });
});

describe("the README", () => {
  const section = readmeSection("Links and small buttons are easy to tap on a phone");

  it("explains the three classes, the rule of a sentence, the numbers and the test", () => {
    for (const piece of [
      "`@media (pointer: coarse)`",
      "`.touch-target` was already there",
      "`.touch-link` is for a link that looks like a button",
      "`.touch-reach` is for a text link that must keep its look",
      "A `::after` box makes the touch area bigger",
      "`@layer`",
      "`.touch-link`",
      "`.touch-reach`",
      "`.touch-target`",
      "`::after`",
      "`PendingButton`",
      "WCAG 2.5.8",
      "44px",
      "`tests/accessibility/touch-links-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(squash(section), piece).toContain(squash(piece));
    }
  });

  it("no longer says in the buttons section that the logo link is left alone", () => {
    const buttons = readmeSection("Buttons are easy to tap on a phone");

    expect(buttons.toLowerCase()).not.toContain("logo link (36px)");

    expect(squash(buttons)).toContain(squash("Links and small buttons are easy to tap on a phone"));
  });

  it("comes after the section about fields on a phone", () => {
    const first = readme.indexOf("## Fields are easy to tap on a phone");

    const second = readme.indexOf("## Links and small buttons are easy to tap on a phone");

    expect(first).toBeGreaterThan(-1);

    expect(second).toBeGreaterThan(first);
  });
});
