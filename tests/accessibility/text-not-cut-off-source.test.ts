import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

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

const has = (path: string, piece: string) => squash(read(path)).includes(squash(piece));

function sourceFiles(): string[] {
  const files: string[] = [];

  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = `${folder}/${entry.name}`;

      if (entry.isDirectory()) {
        walk(path);
      } else if (path.endsWith(".tsx")) {
        files.push(path);
      }
    }
  };

  walk("app");

  walk("components");

  return files.sort();
}

/** The only boxes that may cut text with an ellipsis, and how many each file has. */
const ALLOWED_TRUNCATE: Record<string, number> = {
  // A database id in a monospace font, in a box that is 180px wide. It is a technical value.
  "components/activity/activity-center.tsx": 1,

  // The name of the open page in the menu button of a model. These names are short and fixed.
  "components/projects/project-mobile-workspace-nav.tsx": 1,
};

/** Names and values that the people of a model write, in the boxes where they used to be cut. */
const WRAPPED: Array<[string, string]> = [
  [
    "app/(app)/projects/[projectId]/layout.tsx",
    '<h1 className="break-words text-xl font-semibold tracking-tight">{project.name}</h1>',
  ],
  [
    "app/(app)/workspaces/page.tsx",
    '<h2 className="break-words font-medium">{workspace.name}</h2>',
  ],
  [
    "app/(app)/workspaces/[workspaceId]/page.tsx",
    'className="touch-reach block break-words text-sm font-medium hover:underline"',
  ],
  [
    "app/(app)/workspaces/[workspaceId]/page.tsx",
    '<p className="break-all text-xs text-muted-foreground">{workspace.owner.email}</p>',
  ],
  [
    "app/(app)/workspaces/[workspaceId]/page.tsx",
    '<p className="break-all text-sm font-medium">{invitation.emailNormalized}</p>',
  ],
  ["app/(app)/account/profile/page.tsx", 'className="mt-0.5 break-words text-sm font-medium"'],
  ["app/(app)/layout.tsx", '<div className="break-words text-sm font-medium">{displayName}</div>'],
  [
    "app/(app)/layout.tsx",
    '<div className="break-all text-xs text-muted-foreground">{user.email}</div>',
  ],
  ["app/(app)/dashboard/page.tsx", 'className="break-words group-hover:text-primary"'],
  ["components/scenarios/scenario-manager.tsx", '<div className="break-words font-semibold">'],
  ["components/app/command-palette.tsx", 'className="block break-words text-sm font-medium"'],
  [
    "components/app/command-palette.tsx",
    'className="block break-words text-xs text-muted-foreground"',
  ],
  [
    "components/projects/project-card.tsx",
    'className="touch-reach block break-words font-semibold tracking-tight hover:underline"',
  ],
  [
    "components/projects/project-card.tsx",
    '<div className="mt-1 break-words text-xs text-muted-foreground">',
  ],
  [
    "components/projects/project-card.tsx",
    'className="break-words text-[10px] uppercase tracking-[0.1em] text-muted-foreground"',
  ],
  ["components/projects/project-card.tsx", '"mt-1 break-words text-sm font-semibold tabular-nums"'],
  [
    "components/projects/project-card.tsx",
    '<div className="mt-2 break-words text-sm font-medium">',
  ],
  [
    "components/projects/project-card.tsx",
    '<span className="min-w-0 break-words">{describeSharedTag(sharing)}</span>',
  ],
  [
    "components/dashboard/shared-models-section.tsx",
    '<dd className="mt-1 break-words text-sm font-medium">{children}</dd>',
  ],
  [
    "components/dashboard/shared-models-section.tsx",
    'className="touch-reach block break-words font-semibold tracking-tight hover:underline"',
  ],
  [
    "components/dashboard/shared-models-section.tsx",
    '<p className="mt-1 break-words text-xs text-muted-foreground">',
  ],
  ["components/data-import/import-preview.tsx", 'className="max-w-xs break-words px-3 py-2"'],
  [
    "components/data-import/import-preview.tsx",
    '<dt className="break-words text-muted-foreground">{header}</dt>',
  ],
  [
    "components/data-import/import-history-list.tsx",
    '<p className="min-w-0 break-words text-sm font-medium">{batch.fileName}</p>',
  ],
  [
    "components/data-import/import-history-list.tsx",
    '<dd className="break-words">{describeAttemptUser(batch.createdBy)}</dd>',
  ],
  [
    "components/data-import/import-history-list.tsx",
    'className="break-words rounded-md bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground"',
  ],
];

/** The pages with a row of six cards, and the two loading pages that draw the same row. */
const SIX_CARD_ROWS = [
  "app/(app)/projects/[projectId]/cash-flow/page.tsx",
  "app/(app)/projects/[projectId]/customers/page.tsx",
  "app/(app)/projects/[projectId]/financing/page.tsx",
  "app/(app)/projects/[projectId]/forecast/page.tsx",
  "app/(app)/projects/[projectId]/overview/page.tsx",
  "app/(app)/projects/[projectId]/pnl/page.tsx",
  "components/loading/workspace-loading.tsx",
  "components/reports/executive-report.tsx",
  "components/scenarios/live-scenario-simulator.tsx",
];

/** The public demo has no side menus, so six cards in a row are about 230px wide there. It is unchanged. */
const DEMO_ROWS = ["app/(marketing)/demo/loading.tsx", "app/(marketing)/demo/page.tsx"];

describe("text that is cut with an ellipsis", () => {
  it("is only in the boxes that are listed here, each with a reason", () => {
    const found: Record<string, number> = {};

    for (const file of sourceFiles()) {
      const count = read(file).match(/\btruncate\b/g)?.length ?? 0;

      if (count > 0) {
        found[file] = count;
      }
    }

    expect(found).toEqual(ALLOWED_TRUNCATE);
  });

  it("is not made with text-ellipsis or line-clamp either", () => {
    const bad = sourceFiles().filter((file) =>
      /\b(?:text-ellipsis|line-clamp-\d+)\b/.test(read(file)),
    );

    expect(bad).toEqual([]);
  });
});

describe("names and values that people write", () => {
  it("wrap in every box that was listed, so the whole text can be read", () => {
    for (const [path, piece] of WRAPPED) {
      expect(has(path, piece), `${path}: ${piece}`).toBe(true);
    }
  });

  it("line the values of the three figures up at the bottom, when a label uses two lines", () => {
    expect(
      has(
        "components/projects/project-card.tsx",
        '<div className="flex min-w-0 flex-col justify-between"> <dt className="break-words text-[10px]',
      ),
    ).toBe(true);
  });

  it("show the three figures of a model card in two columns on a very small phone", () => {
    expect(
      has(
        "components/projects/project-card.tsx",
        '<dl className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-accent/50 p-3 min-[360px]:grid-cols-3">',
      ),
    ).toBe(true);
  });
});

describe("the cards with a figure", () => {
  const cards: Array<[string, string]> = [
    ["components/financial/financial-kpi-card.tsx", "text-2xl"],
    ["app/(app)/dashboard/page.tsx", "text-3xl"],
  ];

  it("wrap the value and never cut it", () => {
    for (const [path, size] of cards) {
      expect(
        has(path, `<CardTitle className="mt-2 break-words ${size} tracking-tight tabular-nums">`),
        path,
      ).toBe(true);
    }
  });

  it("hide the icon when the card is narrower than 11rem inside, so the value has the room", () => {
    for (const [path] of cards) {
      expect(read(path), path).toMatch(
        /hidden size-9 shrink-0 items-center justify-center rounded-xl bg-primary\/10 text-primary @min-\[11rem\]\/card-header:flex/,
      );
    }
  });

  it("ask the header of the card for its width, so the header must be a container", () => {
    expect(read("components/ui/card.tsx")).toContain("@container/card-header");
  });
});

describe("rows of six cards", () => {
  it("do not show six in a row below 1800px, except in the public demo, which has no side menus", () => {
    const found = sourceFiles().filter((file) => read(file).includes("2xl:grid-cols-6"));

    expect(found).toEqual(DEMO_ROWS);
  });

  it("show six in a row from 1800px, in these pages and in the loading pages that match them", () => {
    const found = sourceFiles().filter((file) => read(file).includes("min-[1800px]:grid-cols-6"));

    expect(found).toEqual(SIX_CARD_ROWS);
  });

  it("keep three in a row between 1280px and 1800px", () => {
    for (const path of SIX_CARD_ROWS) {
      expect(read(path), path).toContain("sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-6");
    }
  });
});

describe("the README", () => {
  it("explains the rule, the exceptions, the card and the grid, and the test", () => {
    const section = readmeSection("Names and numbers are never cut off");

    for (const piece of [
      "WCAG 1.4.10",
      "`truncate`",
      "`break-words`",
      "`break-all`",
      "`text-ellipsis`",
      "`line-clamp-*`",
      "`FinancialKpiCard`",
      "`@min-[11rem]/card-header:flex`",
      "`min-[1800px]:grid-cols-6`",
      "`min-[360px]:grid-cols-3`",
      "demo page has no side menus",
      "`tests/accessibility/text-not-cut-off-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(section, piece).toContain(piece);
    }
  });
});
