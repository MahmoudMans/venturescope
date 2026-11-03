import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { VARIANTS, readJson, shotName } from "./common.mjs";

/**
 * The texts of the portfolio. Every number comes from the project itself (package.json, the
 * Prisma schema, the folders), and a claim about the database is only written when the project
 * really contains it. Nothing here calls the network or the database.
 */

const BANG = String.fromCharCode(33);

const NOTE = `<${BANG}-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->`;

const number = (value) => Number(value).toLocaleString("en-US");

const clean = (version) => String(version ?? "").replace(/^[\^~]/, "");

const named = (label, version) => (version === "" ? label : `${label} ${version}`);

function walk(dir, keep, found = []) {
  if (existsSync(dir) === false) {
    return found;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }

    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, keep, found);
    } else if (keep(full.split("\\").join("/"))) {
      found.push(full);
    }
  }

  return found;
}

/** Reads the facts that the texts use. A missing folder gives a zero or null, never an error. */
export function collectFacts(root) {
  const pkg = readJson(join(root, "package.json"), {});

  const dep = (name) => clean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? "");

  const pageFiles = walk(join(root, "app"), (file) => file.endsWith("/page.tsx"))
    .map((file) => file.split("\\").join("/"))
    // The index page of a model only redirects to its overview.
    .filter((file) => file.endsWith("/projects/[projectId]/page.tsx") === false);

  const model = pageFiles.filter((file) => file.includes("/projects/[projectId]/")).length;

  const publicPages = pageFiles.filter(
    (file) => file.includes("/(marketing)/") || file.includes("/(auth)/"),
  ).length;

  const schemaFile = join(root, "prisma", "schema.prisma");

  const schema = existsSync(schemaFile) ? readFileSync(schemaFile, "utf8") : "";

  const migrationDir = join(root, "prisma", "migrations");

  const migrations = existsSync(migrationDir)
    ? readdirSync(migrationDir, { withFileTypes: true }).filter(
        (entry) => entry.isDirectory() && /^\d{8,}_/.test(entry.name),
      ).length
    : null;

  const sql = walk(migrationDir, (file) => file.endsWith(".sql")).map((file) =>
    readFileSync(file, "utf8"),
  );

  const lines = walk(root, (file) => /\/(app|components|lib)\//.test(file) && /\.tsx?$/.test(file))
    .map((file) => readFileSync(file, "utf8").split("\n").length)
    .reduce((sum, count) => sum + count, 0);

  return {
    version: pkg.version ?? "",
    deps: {
      next: dep("next"),
      react: dep("react"),
      typescript: dep("typescript"),
      tailwind: dep("tailwindcss"),
      prisma: dep("prisma"),
      auth: dep("next-auth"),
      zod: dep("zod"),
      recharts: dep("recharts"),
      vitest: dep("vitest"),
      playwright: dep("@playwright/test"),
      decimal: dep("decimal.js"),
      pdf: dep("pdf-lib"),
    },
    pages: {
      total: pageFiles.length,
      public: publicPages,
      model,
      app: pageFiles.length - publicPages - model,
    },
    apiRoutes: walk(join(root, "app", "api"), (file) => file.endsWith("/route.ts")).length,
    models: (schema.match(/^model\s+\w+/gm) ?? []).length,
    enums: (schema.match(/^enum\s+\w+/gm) ?? []).length,
    migrations,
    ledger: sql.some((text) => /append-only/i.test(text)),
    closedGuard: sql.some((text) => /closed_period_guard|assert_actual_period_open/i.test(text)),
    unitTests: walk(join(root, "tests"), (file) => /\.test\.tsx?$/.test(file)).length,
    e2eSpecs: walk(join(root, "tests", "e2e"), (file) => file.endsWith(".spec.ts")).length,
    lines,
    scripts: Object.keys(pkg.scripts ?? {}).length,
    docker: existsSync(join(root, "Dockerfile")),
    axe: dep("@axe-core/playwright") !== "",
  };
}

function stackLine(f) {
  return [
    named("Next.js", f.deps.next),
    named("React", f.deps.react),
    "TypeScript",
    named("Tailwind CSS", f.deps.tailwind),
    `${named("Prisma", f.deps.prisma)} with PostgreSQL`,
    "Auth.js",
    "Recharts",
    "Vitest",
    "Playwright",
  ].join(", ");
}

function testLine(f) {
  const parts = [];

  if (f.unitTests > 0) {
    parts.push(`${number(f.unitTests)} unit test files`);
  }

  if (f.e2eSpecs > 0) {
    parts.push(
      `${number(f.e2eSpecs)} browser test files${f.axe ? " with automated accessibility checks" : ""}`,
    );
  }

  return parts.join(" and ");
}

function factRows(f) {
  const rows = [
    [
      "Pages",
      `${f.pages.total} (${f.pages.public} public, ${f.pages.app} app shell, ${f.pages.model} model pages)`,
    ],
    ["API routes", f.apiRoutes],
    ["Database models", f.models > 0 ? `${f.models} tables and ${f.enums} enums` : 0],
    ["Migrations", f.migrations ?? 0],
    ["Lines of TypeScript (app, components, lib)", f.lines > 0 ? number(f.lines) : 0],
    ["Unit test files", f.unitTests],
    ["Browser test files", f.e2eSpecs],
    ["npm scripts", f.scripts],
  ];

  return rows.filter(([, value]) => value !== 0 && value !== "0");
}

function table(head, rows) {
  const line = (cells) => `| ${cells.join(" | ")} |`;

  return [line(head), line(head.map(() => "---")), ...rows.map(line)].join("\n");
}

function linkLines(p) {
  return [
    [p.liveUrl, "Live demo"],
    [p.githubUrl, "Source code"],
    [p.videoUrl, "Demo video"],
    [p.portfolioUrl, "Portfolio"],
    [p.linkedinUrl, "LinkedIn"],
  ]
    .filter(([url]) => url !== "")
    .map(([url, label]) => `- ${label}: ${url}`);
}

function shortText(p) {
  return `${p.projectName} is a full-stack web app for startup financial planning. Founders enter their assumptions and get forecasts, scenarios, risk checks and board-ready reports. Teams compare the plan with real results and keep a trusted record of every change.`;
}

function mediumText(p, f) {
  const tests = testLine(f);

  return `${p.projectName} is a financial planning and scenario simulation app for startups and growing businesses. A founder enters operating assumptions, and one deterministic engine turns them into monthly forecasts, cash runway, scenario comparisons and reports. A team can then load real monthly results, compare them with the plan, explain the differences, close finished months, ask for approvals and prepare a board pack. It runs on a free stack with no paid APIs. It is built with ${stackLine(f)}${tests === "" ? "" : `, and it has ${tests}`}.`;
}

function longText(p, f) {
  const protectedHistory =
    f.ledger && f.closedGuard
      ? "The history is protected inside the database: the activity ledger is append-only and the numbers of a closed month cannot be changed, not even by the application itself."
      : "Every important change is recorded, so the team can see who did what and when.";

  const ops = [
    testLine(f),
    "a release check that runs lint, type check, tests and browser tests",
    f.docker ? "a Docker image" : "",
    "backup, restore, deploy and rollback scripts",
    "health, readiness and diagnostics endpoints",
  ].filter((part) => part !== "");

  return [
    `${p.projectName} helps a founder answer three questions: how long will the cash last, what happens if the plan is wrong, and what did we decide and why. The founder enters assumptions about customers, prices, costs and funding. A deterministic financial engine turns them into monthly and yearly forecasts, a profit and loss statement, cash flow, runway and valuation figures. Base, Bull, Bear and custom scenarios run through the same engine, so the differences come only from the assumptions that were changed.`,
    `Once the company is running, a team loads real monthly results from CSV files (with a preview and checks before anything is saved), compares them with the plan, explains the variances, sets KPI targets and closes finished months. Decisions, approvals, board reviews and board packs sit on top of the same numbers. Models live in workspaces with owner, editor and viewer roles, invitation links, saved versions and an audit trail. ${protectedHistory}`,
    `The project is built to be run, not only shown: ${ops.slice(0, -1).join(", ")} and ${ops[ops.length - 1]}.`,
  ].join("\n\n");
}

function summaryDoc(p, f) {
  const links = linkLines(p);

  return [
    `# ${p.projectName} - project summary`,
    NOTE,
    "## In one line",
    p.tagline,
    "## Short (about 40 words)",
    shortText(p),
    "## Medium (about 110 words)",
    mediumText(p, f),
    "## Long (about 250 words)",
    longText(p, f),
    "## Key facts",
    table(["Fact", "Value"], factRows(f)),
    "## Stack in one line",
    stackLine(f),
    "## Keywords and tags",
    "financial planning, forecasting, scenario analysis, startup finance, SaaS, Next.js, React, TypeScript, Prisma, PostgreSQL, Playwright, accessibility, audit trail, role-based access",
    "## Skills this project shows",
    [
      "- Full-stack design with the Next.js App Router, server components and server actions",
      "- Relational data modelling with Prisma and PostgreSQL",
      "- Money calculations that stay exact, and one source of truth for all numbers",
      "- Authentication, roles, sharing and a safe account lifecycle",
      "- Unit tests, browser tests and automated accessibility checks",
      "- Responsive, accessible interface design with light and dark themes",
      "- Production tooling: Docker, backups, deploy and rollback scripts, health endpoints",
    ].join("\n"),
    "## Links",
    links.length > 0
      ? links.join("\n")
      : "Add your links in portfolio/profile.json and run pnpm portfolio:texts.",
  ].join("\n\n");
}

function groupsOf(pages) {
  const groups = [];

  for (const page of pages) {
    let group = groups.find((item) => item.name === page.group);

    if (group === undefined) {
      group = { name: page.group, pages: [] };

      groups.push(group);
    }

    group.pages.push(page);
  }

  return groups;
}

function featuresDoc(p, pages) {
  const platform = [
    "Workspaces with owner, editor and viewer roles, and one-time invitation links",
    "Saved versions of a model, with restore and a comparison of two versions",
    "An audit trail of closes, decisions, targets, comments and reviews",
    "Approval requests where the requester and the approver are different people",
    "Account security: password, recovery key, active sessions and account deletion",
    "Password reset without any email, with a recovery key",
    "Download all your data as one ZIP file",
    "Light and dark themes, a search palette (Ctrl or Cmd + K) and a menu for phones",
    "Printable pages and a board pack that can be saved as a PDF",
    "Request ids, security headers and rate limiting on sensitive routes",
  ];

  const body = groupsOf(pages)
    .filter((group) => group.name !== "Public pages")
    .map(
      (group) =>
        `### ${group.name}\n\n${group.pages.map((page) => `- **${page.title}:** ${page.caption}`).join("\n")}`,
    );

  return [
    `# ${p.projectName} - feature list`,
    NOTE,
    "## What the pages do",
    body.join("\n\n"),
    "## Platform features",
    platform.map((line) => `- ${line}`).join("\n"),
    "## Public pages",
    groupsOf(pages)
      .filter((group) => group.name === "Public pages")
      .flatMap((group) => group.pages.map((page) => `- **${page.title}:** ${page.caption}`))
      .join("\n"),
  ].join("\n\n");
}

function stackDoc(p, f) {
  const rows = [
    [
      "Framework",
      "Next.js (App Router)",
      f.deps.next,
      "Server components and server actions keep the data code on the server.",
    ],
    ["UI library", "React", f.deps.react, "Components for every page, with accessible patterns."],
    [
      "Language",
      "TypeScript",
      f.deps.typescript,
      "Types catch mistakes in money maths and in forms.",
    ],
    [
      "Styling",
      "Tailwind CSS and shadcn/ui",
      f.deps.tailwind,
      "Design tokens give light and dark themes from one set of colors.",
    ],
    [
      "Charts",
      "Recharts",
      f.deps.recharts,
      "Charts that match the theme and can be read by screen readers.",
    ],
    [
      "Database",
      "PostgreSQL with Prisma",
      f.deps.prisma,
      "Typed queries, migrations, and database rules for history.",
    ],
    [
      "Sign-in",
      "Auth.js (next-auth)",
      f.deps.auth,
      "Email and password sign-in with hashed passwords.",
    ],
    ["Validation", "Zod", f.deps.zod, "One schema checks a form on the client and on the server."],
    [
      "Exact maths",
      "decimal.js",
      f.deps.decimal,
      "Money is not calculated with floating point numbers.",
    ],
    [
      "PDF reports",
      "pdf-lib",
      f.deps.pdf,
      "PDF reports are made on the server without a paid service.",
    ],
    [
      "Unit tests",
      "Vitest",
      f.deps.vitest,
      "Fast tests for the calculation engine, services and components.",
    ],
    [
      "Browser tests",
      "Playwright",
      f.deps.playwright,
      "Real browser tests, including accessibility checks.",
    ],
  ].filter((row) => row[2] !== "");

  const notes = [
    "**One financial engine.** Forecast, P&L, cash flow, scenarios, reports and the board pack all read the same calculated numbers, so two pages can never disagree.",
    "**Services between pages and database.** Pages call services (imports, approvals, closing a month). The demo data script calls the same services, so the audit trail it makes is real.",
    f.ledger && f.closedGuard
      ? "**Rules in the database.** The activity ledger is append-only and closed months are locked by database triggers, so even a bug in the app cannot rewrite history."
      : "**Audit trail.** Important actions are written to a ledger that the pages only read.",
    "**Security layer.** One request handler adds a request id, rejects cross-origin state-changing requests and rate limits sensitive routes. Security headers are set for every page.",
    "**Observability.** Health, readiness, version and diagnostics endpoints help to check a running copy.",
    f.docker
      ? "**Operations.** A Docker image, compose files, backup and restore with a verify step, deploy and rollback scripts, and a smoke test."
      : "**Operations.** Backup and restore with a verify step, deploy and rollback scripts, and a smoke test.",
  ];

  return [
    `# ${p.projectName} - tech stack`,
    NOTE,
    "## Stack",
    table(["Area", "Technology", "Version", "Why"], rows),
    "## Architecture notes",
    notes.map((line) => `- ${line}`).join("\n"),
  ].join("\n\n");
}

function pictureOf(page, index, variant, has, from) {
  const rel = `screenshots/${variant}/${shotName(page, index)}.png`;

  return has(rel) ? { rel, path: from === "texts" ? `../${rel}` : rel } : null;
}

function altOf(p, page) {
  return `${page.title} in ${p.projectName}. ${page.caption}`;
}

function captionsDoc(p, pages, has) {
  const sections = groupsOf(pages.map((page, index) => ({ ...page, index }))).map((group) => {
    const items = group.pages.map((page) => {
      const main = pictureOf(page, page.index, "desktop", has, "texts");

      const mobileOnly = page.desktop === false;

      const first =
        main ?? (mobileOnly ? pictureOf(page, page.index, "mobile", has, "texts") : null);

      const others = [
        ["dark", "Dark theme"],
        ["mobile", "Phone"],
      ]
        .map(([variant, label]) => [label, pictureOf(page, page.index, variant, has, "texts")])
        .filter(([, picture]) => picture !== null && picture !== first)
        .map(([label, picture]) => `[${label}](${picture.path})`);

      const full = has(`screenshots/desktop/${shotName(page, page.index)}-full.png`)
        ? [`[Full page](../screenshots/desktop/${shotName(page, page.index)}-full.png)`]
        : [];

      return [
        `### ${page.index + 1}. ${page.title}`,
        first === null
          ? "_The picture was not taken yet. Run pnpm portfolio._"
          : `${BANG}[${altOf(p, page)}](${first.path})`,
        `- **File:** ${first === null ? "-" : first.rel}`,
        `- **Page:** ${page.route}`,
        `- **Caption:** ${page.caption}`,
        `- **What to notice:** ${page.notice}`,
        `- **Alt text:** ${altOf(p, page)}`,
        `- **Other versions:** ${[...others, ...full].join(", ") || "none"}`,
      ].join("\n");
    });

    return `## ${group.name}\n\n${items.join("\n\n")}`;
  });

  return [`# ${p.projectName} - captions for every picture`, NOTE, sections.join("\n\n")].join(
    "\n\n",
  );
}

function csvCell(value) {
  const text = String(value);

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function captionsCsv(p, pages, has) {
  const rows = pages.map((page, index) => {
    const file = [
      pictureOf(page, index, "desktop", has, "root"),
      pictureOf(page, index, "mobile", has, "root"),
    ].find((picture) => picture !== null);

    return [
      index + 1,
      page.group,
      page.title,
      file === undefined ? "" : file.rel,
      page.caption,
      page.notice,
      altOf(p, page),
    ];
  });

  return `${[["number", "group", "title", "file", "caption", "what_to_notice", "alt_text"], ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n")}\n`;
}

const STORY = [
  ["landing", "The public home page tells the idea in one screen."],
  ["dashboard", "After sign-in, every model with live portfolio numbers and what needs attention."],
  ["forecast", "One deterministic engine turns assumptions into forecasts."],
  ["scenario-comparison", "Base, Bull and Bear side by side, with the drivers that differ."],
  ["actuals", "Real monthly results against the plan."],
  ["imports", "CSV files are previewed and checked before anything is saved."],
  ["period-close", "Finished months are locked, and a reopen leaves a record."],
  ["risk-center", "Cash guardrails and runway turn numbers into warnings."],
  ["approvals", "Important decisions need a second person."],
  ["activity", "An audit trail that nobody can edit."],
  ["board-pack", "Everything in one report for the board."],
];

function storyRows(pages, has) {
  return STORY.map(([slug, line]) => {
    const index = pages.findIndex((page) => page.slug === slug);

    const picture = index < 0 ? null : pictureOf(pages[index], index, "desktop", has, "texts");

    return { slug, line, index, picture, page: pages[index] };
  }).filter((row) => row.index >= 0);
}

function caseStudyDoc(p, pages, f, has) {
  const hard = [];

  if (f.ledger && f.closedGuard) {
    hard.push(
      "### Writing a believable history into a database that refuses to be rewritten\n\nThe demo company needs nine months of history. But the activity ledger cannot be edited, and the numbers of a closed month cannot be changed. The obvious plan, create everything and then move the dates, is refused by the database itself. The solution: the demo data script sets a story clock before every step, so each row and each event is written with its own date from the start. A check on the first account stops the run early if the clock does not work, before anything permanent is written.",
    );
  }

  hard.push(
    "### Imports that match how people really save files\n\nFinance teams do not send perfect CSV files. They save from Excel in other languages, write months in many ways, start the table below a title and name columns as they like. The Data Import Center reads those files, shows a preview with the problems first, and only writes after an explicit apply. It respects closed months, writes in one step and keeps a history.",
    "### One product from many pages\n\nThe app has " +
      `${f.pages.total} pages. To keep them one product, they share the same page header, tables, notices and design tokens, and the same patterns for print, phones and keyboard use.`,
  );

  const learned = [
    f.ledger || f.closedGuard
      ? "Put the rules that must never break into the database, then test them there."
      : "Keep the rules that must never break close to the data, and test them.",
    "A shared service layer pays off: the pages, the demo data and the tests all use the same code paths.",
    "Accessibility and phone layouts are cheaper when every page is built for them from the start.",
    "A believable demo needs a story with a timeline, not random numbers.",
  ];

  const story = storyRows(pages, has);

  return [
    `# ${p.projectName} - case study`,
    NOTE,
    `**Role:** ${p.role}  \n**Type:** personal full-stack project  \n**Stack:** ${stackLine(f)}`,
    linkLines(p).join("\n") || "_Add your links in portfolio/profile.json._",
    "## Overview",
    mediumText(p, f),
    "## Why I built it",
    "_Check this paragraph and make it your own._\n\nEarly-stage companies often plan in spreadsheets. A spreadsheet is quick, but it is easy to change an old number without noticing, there is no clear record of who changed what, and different tabs can disagree. I wanted to see how far a web app can go in the other direction: one calculation engine, one place for the assumptions, and a record that nobody can quietly rewrite.",
    "## What it does",
    groupsOf(pages)
      .filter((group) => group.name !== "Public pages" && group.name !== "App shell")
      .map((group) => `- **${group.name}:** ${group.pages.map((page) => page.title).join(", ")}`)
      .join("\n"),
    "## How it is built",
    [
      "1. **One financial engine for every page.** Forecast, scenarios, reports and the board pack read the same numbers.",
      "2. **Services between pages and database.** Pages call services for imports, approvals and closing a month, and the demo data uses the same services.",
      f.ledger && f.closedGuard
        ? "3. **Rules in the database.** An append-only ledger and locked closed months, enforced by database triggers."
        : "3. **An audit trail.** Important actions are recorded in a ledger that pages only read.",
      "4. **Security without email.** Hashed passwords, a recovery key instead of reset emails, rate limits, security headers and a check against cross-origin requests.",
      "5. **Built to be tested.** " +
        (testLine(f) === ""
          ? "Unit tests and browser tests."
          : `${testLine(f)[0].toUpperCase()}${testLine(f).slice(1)}.`),
      "6. **Built to be run.** " +
        (f.docker ? "A Docker image, " : "") +
        "backup and restore with a verify step, deploy and rollback scripts, and health endpoints.",
    ].join("\n"),
    "## Hard problems",
    hard.join("\n\n"),
    "## Results",
    table(["Fact", "Value"], factRows(f)),
    "## What I learned",
    "_Edit these so they match your own experience._\n\n" +
      learned.map((line) => `- ${line}`).join("\n"),
    "## What I would do next",
    [
      "- Put a public, read-only copy online with the demo data.",
      "- Move the rate limiter from memory to a shared store before running more than one copy of the app.",
      "- Cache the heavy analysis pages, because the engine is deterministic.",
      "- Add a short video of the main story to the README.",
    ].join("\n"),
    "## Pictures for this story",
    table(
      ["Step", "Picture", "What it shows"],
      story.map((row) => [
        row.page.title,
        row.picture === null ? "not taken yet" : `[${row.picture.rel}](${row.picture.path})`,
        row.line,
      ]),
    ),
  ].join("\n\n");
}

function postsDoc(p, f) {
  const tests = testLine(f);

  const links = linkLines(p).map((line) => line.replace(/^- /, ""));

  const thread = [
    `1/5 I built ${p.projectName}: a financial planning app for startups. Assumptions in, forecasts, scenarios and board-ready reports out. Here is how it works.`,
    "2/5 One deterministic engine feeds every page: forecast, P&L, cash flow, runway and scenarios. Two pages can never disagree.",
    "3/5 Real life is added with CSV imports: a preview, checks, then an explicit apply. Finished months are locked and every reopen leaves a record.",
    "4/5 Decisions, approvals and board reviews sit on the same numbers. The activity trail cannot be edited.",
    `5/5 Built with ${named("Next.js", f.deps.next)}, ${named("React", f.deps.react)}, Prisma and PostgreSQL.${tests === "" ? "" : ` ${tests[0].toUpperCase()}${tests.slice(1)}.`} ${p.githubUrl}`.trim(),
  ];

  const topics = [
    "nextjs",
    "react",
    "typescript",
    "prisma",
    "postgresql",
    "tailwindcss",
    "playwright",
    "vitest",
    "financial-planning",
    "saas",
  ];

  return [
    `# ${p.projectName} - posts and descriptions`,
    NOTE,
    "## LinkedIn post",
    [
      `I just finished ${p.projectName}: a financial planning app for startups, built from scratch.`,
      "What it does:\n- Turns assumptions into forecasts, runway and scenarios (Base, Bull, Bear)\n- Compares the plan with real monthly results and explains the gaps\n- Locks closed months, asks for approvals and keeps an audit trail\n- Makes board-ready reports (PDF and CSV) without paid services",
      `Under the hood: ${stackLine(f)}.${tests === "" ? "" : ` ${tests[0].toUpperCase()}${tests.slice(1)}.`}`,
      links.join("\n"),
      "#nextjs #react #typescript #postgresql #prisma #webdevelopment #buildinpublic",
    ]
      .filter((part) => part !== "")
      .join("\n\n"),
    "## Short thread (each post is 280 characters or less)",
    thread.map((post) => `    ${post}`).join("\n\n"),
    "## GitHub repository description (350 characters or less)",
    `Financial planning and scenario simulation for startups: forecasts, scenarios, risk, approvals and board packs. ${named("Next.js", f.deps.next)}, TypeScript, Prisma, PostgreSQL. Free stack, no paid APIs.`,
    "## GitHub topics",
    topics.join(", "),
    "## Blog or Dev.to introduction",
    `Spreadsheets are where most startups plan their money, and where most plans quietly break: an old number is changed, nobody knows who did it, and two tabs disagree. I built ${p.projectName} to try the opposite: one calculation engine, one place for the assumptions, and a record that nobody can rewrite. In this post I show how the forecast works, how real results are imported and closed, and how the database protects the history.`,
  ].join("\n\n");
}

function cvDoc(p, f) {
  const bullets = [
    `Built ${p.projectName}, a full-stack financial planning app (${named("Next.js", f.deps.next)}, ${named("React", f.deps.react)}, TypeScript, Prisma, PostgreSQL) with ${f.pages.total} pages for forecasting, scenarios, risk, approvals and board reporting.`,
    "Designed a deterministic forecasting engine that feeds the P&L, cash flow, scenarios and PDF/CSV reports from one source of truth.",
    f.ledger && f.closedGuard
      ? "Protected the history of the numbers inside the database: an append-only activity ledger and locked closed months, enforced by triggers."
      : "Added an audit trail for closes, decisions, approvals and reviews.",
    "Implemented workspaces with owner, editor and viewer roles, one-time invitation links, saved model versions and approval workflows.",
    "Built a data import center that previews, validates and applies CSV files in the formats that Excel users really produce.",
    testLine(f) === ""
      ? "Wrote unit and browser tests for the main flows."
      : `Wrote ${testLine(f)}, and a release check that runs lint, type check, tests and browser tests.`,
    `Prepared the app for production with ${f.docker ? "a Docker image, " : ""}backup and restore scripts, deploy and rollback scripts, rate limiting and health endpoints.`,
  ];

  return [
    `# ${p.projectName} - CV and LinkedIn text`,
    NOTE,
    "## Bullets for a CV (pick four to six)",
    bullets.map((line) => `- ${line}`).join("\n"),
    "## One-line entry",
    `${p.projectName} - ${p.tagline} (${stackLine(f)})`,
    "## LinkedIn project section",
    shortText(p),
    "## Cover letter sentence",
    `A project I am proud of is ${p.projectName}, a financial planning app where every number comes from one engine and every change leaves a record. It shows how I design, build, test and run a full application.`,
  ].join("\n\n");
}

const VIDEO = [
  [
    "0:00",
    "landing",
    "This is VentureScope, a financial planning app for startups. It turns assumptions into forecasts, scenarios and reports.",
  ],
  [
    "0:15",
    "live-demo",
    "Anyone can explore a sample company without signing up. Watch the numbers change when I switch the scenario.",
  ],
  [
    "0:35",
    "dashboard",
    "After sign-in, the dashboard shows every model, the portfolio numbers and what needs attention.",
  ],
  [
    "0:55",
    "overview",
    "Inside a model, the header shows currency, horizon and scenarios. The assumptions feed everything else.",
  ],
  [
    "1:15",
    "forecast",
    "One deterministic engine produces the forecast. The P&L, cash flow and reports read the same numbers.",
  ],
  [
    "1:35",
    "scenario-comparison",
    "Base, Bull and Bear run through the same engine, and I can see exactly which drivers differ.",
  ],
  [
    "1:55",
    "actuals",
    "Real monthly results are compared with the plan, with favorable and unfavorable variances.",
  ],
  [
    "2:15",
    "period-close",
    "Finished months are locked. A reopen needs a reason and leaves a record.",
  ],
  ["2:35", "approvals", "Important decisions need approval from a second person, with a note."],
  ["2:50", "activity", "Everything lands in an audit trail that cannot be edited."],
  ["3:05", "board-pack", "At the end, a board pack that can be printed or saved as a PDF."],
];

function videoDoc(p, pages, f) {
  const rows = VIDEO.map(([time, slug, say]) => {
    const page = pages.find((item) => item.slug === slug);

    return [time, page === undefined ? slug : `${page.title} (${page.route})`, say];
  });

  return [
    `# ${p.projectName} - demo video script`,
    NOTE,
    "A demo of about 3 minutes. Keep each page on screen for about 15 to 20 seconds, and show the work, not the code.",
    "## Before you record",
    [
      "1. Run  pnpm demo  and wait for the app. It shows the sign-in details.",
      "2. Sign in as demo@venturescope.test with the password Orbit-Demo-2026-Plan (all demo accounts use it).",
      "3. Use a window of 1920 x 1080, browser zoom 100%, no bookmarks bar, notifications off.",
      "4. Record with any free screen recorder. Speak slowly. One take is fine.",
    ].join("\n"),
    "## Script",
    table(["Time", "Screen", "Say"], rows),
    "## Closing line",
    `${p.projectName} is built with ${stackLine(f)}. ${testLine(f) === "" ? "" : `It has ${testLine(f)}. `}The source code is linked below.`.trim(),
  ].join("\n\n");
}

function interviewDoc(p, f) {
  const qa = [
    [
      "Walk me through the project in one minute.",
      `${shortText(p)} I would start with the forecast page, then show real results against the plan, closing a month and an approval.`,
    ],
    [
      "Why a deterministic engine and not a spreadsheet or machine learning?",
      "A founder has to explain every number to an investor. A deterministic engine gives the same result for the same assumptions, so any change can be traced to the input that caused it. Scenarios use the same engine, so differences come only from the assumptions that changed.",
    ],
    f.ledger && f.closedGuard
      ? [
          "How do you stop the history from being rewritten?",
          "Two rules live in the database as triggers: the activity ledger is append-only, and the numbers of a closed month cannot be changed. Because the database enforces them, a bug or a missing check in the app cannot break them. Reopening a month is a deliberate action with a reason and an approval.",
        ]
      : [
          "How do you keep an audit trail?",
          "Important actions (closing a month, decisions, approvals, reviews) are written to a ledger that the pages only read, with the person and the time.",
        ],
    [
      "How is the app secured?",
      "Passwords are hashed. Sessions can be ended from the account page. Sensitive routes are rate limited, every request gets an id, cross-origin state-changing requests are rejected and security headers are set. Because the app sends no emails, a forgotten password is reset with a recovery key calculated from the secret, the account and the current password hash.",
    ],
    [
      "How did you test it?",
      testLine(f) === ""
        ? "With unit tests for the engine and services and browser tests for the main flows."
        : `There are ${testLine(f)}. The engine and the services have unit tests, the main flows run in a real browser, and the release check runs lint, type check, tests and browser tests together.`,
    ],
    f.ledger && f.closedGuard
      ? [
          "What was the hardest problem?",
          "Making a believable demo. The database refuses to edit the ledger or a closed month, so I could not create data and move the dates afterwards. The demo script sets a story clock before each step so every row is written with its own date, and it checks that the clock works before anything permanent is written.",
        ]
      : [
          "What was the hardest problem?",
          "Keeping many pages consistent while the product grew: shared components, one set of design tokens and one calculation engine.",
        ],
    [
      "How would you run it in production?",
      f.docker
        ? "As a Docker image behind a proxy, with PostgreSQL, backups that are verified, health and readiness endpoints, and deploy and rollback scripts. A smoke test checks a running copy."
        : "Behind a proxy with PostgreSQL, backups that are verified, health and readiness endpoints, and deploy and rollback scripts.",
    ],
    [
      "What would you change to scale it?",
      "The rate limiter keeps its counters in memory, so I would move them to a shared store before running more than one copy. I would also cache the heavy analysis pages, because the engine is deterministic, and move PDF creation to a background job.",
    ],
    [
      "How did you build it, and which tools did you use?",
      "[Write your own honest answer here: say which parts you designed and wrote yourself, which tools you used (for example AI coding assistants), and how you checked and tested the result.]",
    ],
  ];

  return [
    `# ${p.projectName} - interview questions`,
    NOTE,
    "The answers are drafts based on the real project. Read each one, check it against the code, and say it in your own words. The last answer is yours to write.",
    qa.map(([question, answer], index) => `## ${index + 1}. ${question}\n\n${answer}`).join("\n\n"),
  ].join("\n\n");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function galleryDoc(p, pages, has) {
  const cards = [];

  pages.forEach((page, index) => {
    const name = shotName(page, index);

    const versions = [
      ...VARIANTS.map((variant) => [variant.name, `screenshots/${variant.name}/${name}.png`]),
      ["full", `screenshots/desktop/${name}-full.png`],
    ];

    for (const [kind, rel] of versions) {
      if (has(rel) === false) {
        continue;
      }

      const alt = altOf(p, page);

      cards.push(
        `<figure data-kind="${kind}" data-group="${escapeHtml(page.group)}"><a href="${rel}"><img loading="lazy" src="${rel}" alt="${escapeHtml(alt)}"></a><figcaption><strong>${index + 1}. ${escapeHtml(page.title)}</strong> <span class="tag">${kind}</span><br>${escapeHtml(page.caption)}<details><summary>More</summary><p>${escapeHtml(page.notice)}</p><p><code>${escapeHtml(rel)}</code></p></details><button type="button" data-copy="${escapeHtml(alt)}">Copy alt text</button></figcaption></figure>`,
      );
    }
  });

  const groups = [...new Set(pages.map((page) => page.group))];

  return `<${BANG}doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(p.projectName)} gallery</title>
<style>
:root{--bg:#fafafc;--fg:#14151f;--card:#fff;--line:#d9dbe6;--accent:#4f46e5}
@media (prefers-color-scheme:dark){:root{--bg:#14151f;--fg:#f2f3f8;--card:#1d1f2e;--line:#33364a;--accent:#818cf8}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}
header{padding:24px 16px;max-width:1200px;margin:0 auto}
nav{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 16px;max-width:1200px;margin:0 auto}
button,select{font:inherit;padding:6px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg);cursor:pointer}
button.on{border-color:var(--accent);outline:2px solid var(--accent)}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;padding:0 16px 48px;max-width:1200px;margin:0 auto}
figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
figure img{width:100%;display:block;aspect-ratio:16/10;object-fit:cover;object-position:top;background:var(--line)}
figcaption{padding:12px;font-size:14px}
.tag{font-size:12px;border:1px solid var(--line);border-radius:99px;padding:0 8px}
[hidden]{display:none}
</style>
</head>
<body>
<header><h1>${escapeHtml(p.projectName)} gallery</h1><p>${cards.length} pictures. Click a picture to open it at full size. Texts for every picture are in the texts folder.</p></header>
<nav>
${["all", ...VARIANTS.map((variant) => variant.name), "full"].map((kind) => `<button type="button" data-kind="${kind}"${kind === "all" ? ' class="on"' : ""}>${kind === "full" ? "full page" : kind}</button>`).join("\n")}
<select id="group"><option value="">All groups</option>${groups.map((group) => `<option>${escapeHtml(group)}</option>`).join("")}</select>
</nav>
<main>
${cards.join("\n")}
</main>
<script>
var kind="all",group="";
function show(){document.querySelectorAll("figure").forEach(function(f){f.hidden=(kind!=="all"&&f.dataset.kind!==kind)||(group!==""&&f.dataset.group!==group)})}
document.querySelectorAll("nav button").forEach(function(b){b.onclick=function(){kind=b.dataset.kind;document.querySelectorAll("nav button").forEach(function(x){x.classList.toggle("on",x===b)});show()}});
document.getElementById("group").onchange=function(e){group=e.target.value;show()};
document.querySelectorAll("button[data-copy]").forEach(function(b){b.onclick=function(){navigator.clipboard.writeText(b.dataset.copy);b.textContent="Copied";setTimeout(function(){b.textContent="Copy alt text"},1500)}});
</script>
</body>
</html>
`;
}

function readmeDoc(p, pages, f, manifest, has, today) {
  const count = (variant) =>
    pages.filter((page, index) => has(`screenshots/${variant}/${shotName(page, index)}.png`))
      .length;

  const fullCount = pages.filter((page, index) =>
    has(`screenshots/desktop/${shotName(page, index)}-full.png`),
  ).length;

  const exportsList = (manifest.exports ?? []).map((item) => item.file);

  const problems = (manifest.shots ?? []).filter((shot) => shot.ok === false);

  const todo = [
    p.name === "Your Name"
      ? "- [ ] Write your name and links in portfolio/profile.json, then run  pnpm portfolio:texts"
      : "- [x] profile.json has your name",
    p.githubUrl === ""
      ? "- [ ] Add the address of your GitHub repository (githubUrl)"
      : "- [x] GitHub link added",
    p.liveUrl === ""
      ? "- [ ] Optional: put a read-only copy online and add its address (liveUrl)"
      : "- [x] Live demo link added",
    p.videoUrl === ""
      ? "- [ ] Record the demo video (see texts/demo-video-script.md) and add its address (videoUrl)"
      : "- [x] Video link added",
    "- [ ] Open gallery.html and look at every picture. Retake a page with  pnpm portfolio:shots --only=name",
    "- [ ] Read texts/case-study.md and change the parts marked as yours (why you built it, what you learned)",
    "- [ ] Read texts/interview-qa.md and write answer 9 in your own words",
    "- [ ] Copy the best 6 to 8 pictures into your portfolio site, with the captions and alt texts",
    "- [ ] Put 2 or 3 pictures at the top of the README of the repository",
    "- [ ] Check that no real secrets are in the pictures or in .env files that you commit",
  ];

  return [
    `# ${p.projectName} portfolio kit`,
    NOTE,
    `Made on ${today}. Everything in this folder was made by  pnpm portfolio  from the running demo. The data is fictional (the Orbit Analytics sample company).`,
    "## What is here",
    table(
      ["Path", "What it is"],
      [
        [
          "gallery.html",
          "Open it in a browser to see every picture, filter them and copy alt texts",
        ],
        [
          "screenshots/desktop",
          `${count("desktop")} pictures of the pages, light theme, 1440 x 900, ${manifest.scale ?? 2}x sharp`,
        ],
        ["screenshots/desktop/*-full.png", `${fullCount} full-page pictures of the long pages`],
        ["screenshots/dark", `${count("dark")} pictures with the dark theme`],
        ["screenshots/mobile", `${count("mobile")} pictures on a phone screen (390 wide)`],
        [
          "exports",
          exportsList.length > 0
            ? exportsList.join(", ")
            : "sample PDF, CSV and JSON files made by the app (none yet)",
        ],
        ["texts/project-summary.md", "Short, medium and long descriptions, key facts, tags"],
        ["texts/case-study.md", "The full story of the project, ready to edit"],
        [
          "texts/captions.md and captions.csv",
          "A caption, what to notice and an alt text for every picture",
        ],
        ["texts/features.md", "The feature list"],
        ["texts/tech-stack.md", "Technologies, versions and architecture notes"],
        [
          "texts/posts.md",
          "LinkedIn post, short thread, GitHub description and topics, blog introduction",
        ],
        ["texts/cv-bullets.md", "CV bullets and short entries"],
        ["texts/demo-video-script.md", "A 3 minute script that follows the pictures"],
        ["texts/interview-qa.md", "Nine questions with draft answers"],
        ["profile.json", "Your name and links. Edit it, then run  pnpm portfolio:texts"],
        ["manifest.json", "A list of every picture and how it went"],
      ],
    ),
    "## Numbers from the project",
    table(["Fact", "Value"], factRows(f)),
    "## Checklist before you publish",
    todo.join("\n"),
    problems.length > 0
      ? `## Pictures with a problem\n\n${problems.map((shot) => `- ${shot.variant} ${shot.slug}: ${shot.problem}`).join("\n")}\n\nTry again with  pnpm portfolio:shots --only=name . A page that opened with an error has its picture in the problems folder.`
      : "",
    "## Commands",
    [
      "    pnpm portfolio                         pictures and texts (starts the app if it is not running)",
      "    pnpm portfolio:shots --only=forecast   retake some pictures (names are in scripts/portfolio/pages.json)",
      "    pnpm portfolio:shots --quick           only the normal desktop pictures",
      "    pnpm portfolio:texts                   write the texts again (after you edit profile.json)",
    ].join("\n"),
    "Settings: PORTFOLIO_URL (default http://localhost:3000), PORTFOLIO_SCALE (1 to 3, default 2), PORTFOLIO_SETTLE_MS (default 1800).",
  ]
    .filter((part) => part !== "")
    .join("\n\n");
}

/** Returns an object: file path inside the portfolio folder -> text. */
export function buildDocuments({ profile, pages, facts, manifest, has, today }) {
  return {
    "README.md": `${readmeDoc(profile, pages, facts, manifest, has, today)}\n`,
    "gallery.html": galleryDoc(profile, pages, has),
    "texts/project-summary.md": `${summaryDoc(profile, facts)}\n`,
    "texts/case-study.md": `${caseStudyDoc(profile, pages, facts, has)}\n`,
    "texts/captions.md": `${captionsDoc(profile, pages, has)}\n`,
    "texts/captions.csv": captionsCsv(profile, pages, has),
    "texts/features.md": `${featuresDoc(profile, pages)}\n`,
    "texts/tech-stack.md": `${stackDoc(profile, facts)}\n`,
    "texts/posts.md": `${postsDoc(profile, facts)}\n`,
    "texts/cv-bullets.md": `${cvDoc(profile, facts)}\n`,
    "texts/demo-video-script.md": `${videoDoc(profile, pages, facts)}\n`,
    "texts/interview-qa.md": `${interviewDoc(profile, facts)}\n`,
  };
}
