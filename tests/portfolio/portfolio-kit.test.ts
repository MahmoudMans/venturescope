import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEMO_ACCOUNT,
  ROOT,
  pickProjectId,
  pickWorkspaceId,
  resolveRoute,
} from "@/scripts/portfolio/common.mjs";
import { buildDocuments } from "@/scripts/portfolio/docs.mjs";
import pagesFile from "@/scripts/portfolio/pages.json";
import { DEMO_PASSWORD, DEMO_PEOPLE, demoModelName } from "@/scripts/seed/demo-config";

type Page = {
  slug: string;
  route: string;
  title: string;
  group: string;
  caption: string;
  notice: string;
  dark?: boolean;
  mobile?: boolean;
  full?: boolean;
  desktop?: boolean;
  status?: number;
  action?: string;
};

const pages = pagesFile as Page[];

const read = (path: string) => readFileSync(path, "utf8");

const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts;

const GROUPS = [
  "Public pages",
  "App shell",
  "Model inputs",
  "Forecast and analysis",
  "Actuals and control",
  "Planning and risk",
  "Governance",
  "Portfolio and output",
];

/** Pages that the kit does not open: the index of a model only redirects, an invitation needs a token. */
const NOT_OPENED = ["/projects/:project", "/invite/:token"];

function pageFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;

    if (entry.isDirectory()) {
      return pageFiles(path);
    }

    return entry.name === "page.tsx" ? [path] : [];
  });
}

/** app/(app)/projects/[projectId]/forecast/page.tsx becomes /projects/:project/forecast */
function routeOf(file: string): string {
  const parts = file
    .replace(/^app\//, "")
    .replace(/\/?page\.tsx$/, "")
    .split("/")
    .filter((part) => part !== "" && (part.startsWith("(") && part.endsWith(")")) === false)
    .map((part) => {
      if (part === "[projectId]") {
        return ":project";
      }

      if (part === "[workspaceId]") {
        return ":workspace";
      }

      return part.startsWith("[") ? `:${part.slice(1, -1)}` : part;
    });

  return `/${parts.join("/")}`;
}

const appRoutes = pageFiles("app").map(routeOf);

describe("the list of pages", () => {
  it("has a clear, short text for every page and no page twice", () => {
    expect(pages.length).toBeGreaterThan(40);

    expect(new Set(pages.map((page) => page.slug)).size).toBe(pages.length);

    for (const page of pages) {
      expect(page.slug, page.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);

      expect(page.route.startsWith("/"), page.slug).toBe(true);

      expect(GROUPS, page.slug).toContain(page.group);

      expect(page.title.length, `${page.slug} title`).toBeGreaterThan(2);

      expect(page.caption.length, `${page.slug} caption`).toBeGreaterThan(20);

      expect(page.caption.length, `${page.slug} caption`).toBeLessThan(160);

      expect(page.notice.length, `${page.slug} notice`).toBeGreaterThan(10);

      expect(page.notice.length, `${page.slug} notice`).toBeLessThan(140);

      if (page.status !== undefined) {
        expect(page.status, page.slug).toBe(404);
      }

      if (page.action !== undefined) {
        expect(["palette", "mobile-menu"], page.slug).toContain(page.action);
      }
    }
  });

  it("opens only pages that exist in the app", () => {
    for (const page of pages) {
      if (page.status === 404) {
        expect(appRoutes, page.slug).not.toContain(page.route);

        continue;
      }

      expect(appRoutes, `${page.slug}: ${page.route}`).toContain(page.route);
    }
  });

  it("does not forget a page of the app", () => {
    const listed = new Set(pages.map((page) => page.route));

    for (const route of appRoutes) {
      if (NOT_OPENED.includes(route) === false) {
        expect(listed.has(route), `Add ${route} to scripts/portfolio/pages.json`).toBe(true);
      }
    }
  });

  it("puts the pages of one group together and the public pages first", () => {
    const order = pages.map((page) => GROUPS.indexOf(page.group));

    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe("the demo account and the routes", () => {
  it("is the owner account and the model of the seed", () => {
    expect(DEMO_ACCOUNT.email).toBe(DEMO_PEOPLE.owner.email);

    expect(DEMO_ACCOUNT.password).toBe(DEMO_PASSWORD);

    expect(demoModelName("2026-01")).toContain(DEMO_ACCOUNT.modelName);
  });

  it("puts the ids into a route, and gives null when an id is missing", () => {
    expect(resolveRoute("/projects/:project/forecast", { project: "abc" })).toBe(
      "/projects/abc/forecast",
    );

    expect(resolveRoute("/workspaces/:workspace", { workspace: "w1" })).toBe("/workspaces/w1");

    expect(resolveRoute("/projects/:project/forecast", {})).toBeNull();

    expect(resolveRoute("/dashboard", {})).toBe("/dashboard");
  });

  it("finds the demo model in the links of the dashboard", () => {
    const links = [
      { href: "/projects/new", text: "Create model" },
      { href: "/projects/other1/overview", text: "Another model" },
      { href: "/projects/abc123/overview", text: "Orbit Analytics 2026 plan" },
      { href: "/projects/abc123/settings#sharing", text: "Sharing" },
    ];

    expect(pickProjectId(links, "Orbit Analytics")).toBe("abc123");

    expect(pickProjectId(links.slice(0, 2), "Orbit Analytics")).toBe("other1");
  });

  it("does not take the new-model link for a model", () => {
    const create = [{ href: "/projects/new", text: "Create model" }];

    expect(pickProjectId(create, "Orbit")).toBeUndefined();

    expect(
      pickProjectId([{ href: "/projects/new?from=x", text: "Sample" }], "Orbit"),
    ).toBeUndefined();

    expect(pickProjectId([], "Orbit")).toBeUndefined();
  });

  it("finds the demo workspace", () => {
    const links = [
      { href: "/workspaces/new", text: "New workspace" },
      { href: "/workspaces/w9", text: "Other team" },
      { href: "/workspaces/w1", text: "Orbit Analytics" },
      { href: "/workspaces/w1/members", text: "Members" },
    ];

    expect(pickWorkspaceId(links, "Orbit Analytics")).toBe("w1");

    expect(pickWorkspaceId(links.slice(0, 2), "Orbit Analytics")).toBe("w9");

    expect(pickWorkspaceId([links[0]], "Orbit Analytics")).toBeUndefined();
  });

  it("keeps looking at the page until the model link is there", () => {
    const capture = read("scripts/portfolio/capture.mjs");

    expect(capture).toContain('waitForId(page, "/projects/", pickModel');

    expect(capture.includes("waitForSelector('a[href^=\"/projects/\"]'")).toBe(false);
  });

  it("finds the project folder, also when the test runner gives no plain file address", () => {
    expect(existsSync(join(ROOT, "package.json"))).toBe(true);

    expect(existsSync(join(ROOT, "scripts", "portfolio", "pages.json"))).toBe(true);

    const common = read("scripts/portfolio/common.mjs");

    expect(common).toContain("export const ROOT = findRoot();");

    expect(/^export const ROOT = fileURLToPath/m.test(common)).toBe(false);
  });
});

describe("the commands in package.json", () => {
  it("run files that exist", () => {
    expect(scripts.portfolio).toBe("node scripts/portfolio/run.mjs");

    expect(scripts["portfolio:shots"]).toBe("node scripts/portfolio/capture.mjs");

    expect(scripts["portfolio:texts"]).toBe("node scripts/portfolio/write-texts.mjs");

    expect(scripts["test:portfolio-kit"]).toBe("vitest run tests/portfolio");

    for (const file of ["run", "capture", "write-texts", "common", "docs"]) {
      expect(existsSync(`scripts/portfolio/${file}.mjs`), file).toBe(true);
    }
  });
});

describe("the texts", () => {
  const facts = {
    version: "0.1.0",
    deps: {
      next: "16.0.0",
      react: "19.0.0",
      typescript: "5",
      tailwind: "4",
      prisma: "7.0.0",
      auth: "5.0.0",
      zod: "4.0.0",
      recharts: "3.0.0",
      vitest: "4.0.0",
      playwright: "1.60.0",
      decimal: "10.0.0",
      pdf: "1.0.0",
    },
    pages: { total: 50, public: 8, app: 7, model: 35 },
    apiRoutes: 10,
    models: 24,
    enums: 4,
    migrations: 17,
    ledger: true,
    closedGuard: true,
    unitTests: 100,
    e2eSpecs: 30,
    lines: 100000,
    scripts: 50,
    docker: true,
    axe: true,
  };

  const profile = {
    name: "Test Person",
    role: "Developer",
    projectName: "VentureScope",
    tagline: "A tagline.",
    githubUrl: "https://github.com/test/venturescope",
    liveUrl: "",
    videoUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  };

  const make = (has: (path: string) => boolean) =>
    buildDocuments({
      profile,
      pages,
      facts,
      manifest: { shots: [], exports: [] },
      has,
      today: "2026-01-01",
    }) as Record<string, string>;

  it("are all written, also when no picture exists yet", () => {
    for (const has of [() => true, () => false]) {
      const documents = make(has);

      expect(Object.keys(documents).sort()).toEqual(
        [
          "README.md",
          "gallery.html",
          "texts/captions.csv",
          "texts/captions.md",
          "texts/case-study.md",
          "texts/cv-bullets.md",
          "texts/demo-video-script.md",
          "texts/features.md",
          "texts/interview-qa.md",
          "texts/posts.md",
          "texts/project-summary.md",
          "texts/tech-stack.md",
        ].sort(),
      );

      for (const [path, text] of Object.entries(documents)) {
        expect(text.length, path).toBeGreaterThan(200);

        for (const bad of ["undefined", "NaN", "[object"]) {
          expect(text.includes(bad), `${path} contains ${bad}`).toBe(false);
        }
      }
    }
  });

  it("describe every page once and use the facts of the project", () => {
    const documents = make(() => true);

    for (const page of pages) {
      expect(documents["texts/captions.md"], page.slug).toContain(page.caption);
    }

    expect(documents["texts/captions.csv"].trim().split("\n")).toHaveLength(pages.length + 1);

    expect(documents["texts/project-summary.md"]).toContain("16.0.0");

    expect(documents["texts/case-study.md"]).toContain("story clock");
  });

  it("keep the posts inside the limits of the sites", () => {
    const posts = make(() => true)["texts/posts.md"];

    const thread = posts.split("\n").filter((line) => /^ {4}\d\/5 /.test(line));

    expect(thread).toHaveLength(5);

    for (const post of thread) {
      expect(post.trim().length, post).toBeLessThanOrEqual(280);
    }

    const start = posts.indexOf("## GitHub repository description");

    const description = posts.slice(start).split("\n\n")[1];

    expect(description.length).toBeLessThanOrEqual(350);
  });

  it("claim nothing about the database unless the project has it", () => {
    const documents = make(() => true);

    const without = buildDocuments({
      profile,
      pages,
      facts: { ...facts, ledger: false, closedGuard: false },
      manifest: { shots: [], exports: [] },
      has: () => true,
      today: "2026-01-01",
    }) as Record<string, string>;

    expect(documents["texts/cv-bullets.md"]).toContain("append-only");

    expect(without["texts/cv-bullets.md"]).not.toContain("append-only");

    expect(without["texts/case-study.md"]).not.toContain("story clock");

    expect(without["texts/interview-qa.md"]).not.toContain("triggers");
  });

  it("escape the text in the gallery page", () => {
    const html = buildDocuments({
      profile: { ...profile, projectName: 'A "quoted" <name>' },
      pages,
      facts,
      manifest: { shots: [], exports: [] },
      has: () => true,
      today: "2026-01-01",
    }) as Record<string, string>;

    expect(html["gallery.html"]).not.toContain("<name>");

    expect(html["gallery.html"]).toContain("&lt;name&gt;");
  });
});

describe("the kit is safe", () => {
  const sources = ["capture", "common", "docs", "run", "write-texts"].map((name) => ({
    name,
    text: read(`scripts/portfolio/${name}.mjs`),
  }));

  it("never touches the database or the data of the app", () => {
    for (const { name, text } of sources) {
      for (const danger of [
        "@prisma/",
        "PrismaClient",
        'from "pg"',
        "DATABASE_URL",
        "$queryRaw",
        "$executeRaw",
      ]) {
        expect(text.includes(danger), `${name}: ${danger}`).toBe(false);
      }
    }
  });

  it("only reads pages: GET requests, and no deleting of files", () => {
    for (const { name, text } of sources) {
      for (const danger of [
        ".post(",
        ".put(",
        ".delete(",
        ".patch(",
        "rmSync",
        "unlinkSync",
        "rmdirSync",
        "renameSync",
        "rm -rf",
      ]) {
        expect(text.includes(danger), `${name}: ${danger}`).toBe(false);
      }
    }

    expect(read("scripts/portfolio/capture.mjs")).toContain("context.request.get(");
  });

  it("writes only inside the portfolio folder", () => {
    expect(read("scripts/portfolio/common.mjs")).toContain(
      'export const OUT = join(ROOT, "portfolio");',
    );

    for (const { name, text } of sources) {
      for (const line of text.split("\n")) {
        if (/writeFileSync\(|mkdirSync\(|saveText\(|path: /.test(line)) {
          expect(line.includes("ROOT"), `${name}: ${line.trim()}`).toBe(false);
        }
      }
    }
  });

  it("never replaces the profile of the person", () => {
    const common = read("scripts/portfolio/common.mjs");

    const start = common.indexOf("export function loadProfile");

    const body = common.slice(start, common.indexOf("\n}\n", start));

    expect(body.indexOf("existsSync(file) === false")).toBeGreaterThan(-1);

    expect(body.indexOf("existsSync(file) === false")).toBeLessThan(body.indexOf("saveText("));

    expect(body).toContain("is not valid JSON");
  });
});
