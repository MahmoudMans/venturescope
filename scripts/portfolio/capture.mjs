import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  BASE_URL,
  DEMO_ACCOUNT,
  OUT,
  ROOT,
  SCALE,
  SETTLE_MS,
  VARIANTS,
  ensureServer,
  isMain,
  isPublicPage,
  loadPages,
  pickProjectId,
  pickWorkspaceId,
  readJson,
  resolveRoute,
  saveText,
  shotName,
  sleep,
} from "./common.mjs";

/**
 * Takes the pictures of the portfolio. It opens the running app in a real browser (Chromium from
 * Playwright), signs in as the demo account and opens every page of scripts/portfolio/pages.json.
 * After the sign-in it only reads pages: it does not click buttons that change data, and it sends
 * GET requests only.
 *
 *   pnpm portfolio:shots                    all pictures
 *   pnpm portfolio:shots --only=forecast    only some pages (names separated by commas)
 *   pnpm portfolio:shots --quick            only the normal desktop pictures
 *   pnpm portfolio:shots --no-start         never start the app, only use a running one
 */

const IMPORTANT = `${String.fromCharCode(33)}important`;

const HIDE_CSS = `nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none ${IMPORTANT}}*,*::before,*::after{caret-color:transparent ${IMPORTANT}}`;

/** Taller pages are cut here, because browsers cannot make very tall pictures. */
const MAX_FULL_HEIGHT = 9000;

function log(line) {
  process.stdout.write(`${line}\n`);
}

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    if (String(error).includes("Executable doesn't exist") === false) {
      throw error;
    }

    log("The Playwright browser is not installed yet. Installing Chromium (one time)...");

    const result = spawnSync("pnpm", ["exec", "playwright", "install", "chromium"], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error("Could not install the browser. Run  pnpm e2e:install  and try again.");
    }

    try {
      return await chromium.launch();
    } catch (again) {
      throw new Error(
        `The browser still cannot start. Run  pnpm e2e:install  and try again. (${String(again.message).split("\n")[0]})`,
      );
    }
  }
}

async function newContext(browser, variant, storageState) {
  const context = await browser.newContext({
    ...variant.options,
    storageState,
    locale: "en-US",
    reducedMotion: "reduce",
    // The kit only reads pages. The app keeps its own security headers for real visitors.
    bypassCSP: true,
  });

  await context.addInitScript((css) => {
    const add = () => {
      const style = document.createElement("style");

      style.textContent = css;

      (document.head ?? document.documentElement).appendChild(style);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", add);
    } else {
      add();
    }
  }, HIDE_CSS);

  return context;
}

/** The links of the page that start with a text. The list is empty while the page is changing. */
async function readLinks(page, prefix) {
  return page
    .$$eval(
      "a[href]",
      (anchors, start) =>
        anchors
          .filter((anchor) => (anchor.getAttribute("href") ?? "").startsWith(start))
          .map((anchor) => ({
            href: anchor.getAttribute("href") ?? "",
            text: (anchor.textContent ?? "").replace(/\s+/g, " ").trim(),
          })),
      prefix,
    )
    .catch(() => []);
}

/**
 * Reads the links of the page again and again until pick() finds an id. A page that was just
 * opened may still be loading, and the menu already has a link to /projects/new, so one look is
 * not enough.
 */
async function waitForId(page, prefix, pick, seconds) {
  const end = Date.now() + seconds * 1000;

  let id = pick(await readLinks(page, prefix));

  while (id === undefined && Date.now() < end) {
    await sleep(1000);

    id = pick(await readLinks(page, prefix));
  }

  return id;
}

/** Signs in as the demo account and finds the ids of the demo model and the demo workspace. */
async function signIn(browser) {
  const context = await newContext(browser, VARIANTS[0]);

  const page = await context.newPage();

  page.setDefaultTimeout(60000);

  let message = "";

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);

    await page.fill('input[name="email"]', DEMO_ACCOUNT.email);

    await page.fill('input[name="password"]', DEMO_ACCOUNT.password);

    await page
      .locator("form")
      .filter({ has: page.locator('input[name="password"]') })
      .first()
      .evaluate((form) => form.requestSubmit());

    try {
      await page.waitForURL(/\/dashboard/, { timeout: 60000 });

      break;
    } catch {
      message = (
        (await page
          .locator('[role="alert"]')
          .first()
          .textContent({ timeout: 2000 })
          .catch(() => "")) ?? ""
      ).trim();

      if (attempt === 2) {
        throw new Error(
          `Could not sign in as ${DEMO_ACCOUNT.email}${message === "" ? "" : ` (the page said: "${message}")`}. ` +
            "Run  pnpm demo  once so the demo accounts exist, then try again.",
        );
      }
    }
  }

  const ids = {};

  const pickModel = (links) => pickProjectId(links, DEMO_ACCOUNT.modelName);

  const pickSpace = (links) => pickWorkspaceId(links, DEMO_ACCOUNT.modelName);

  const found = process.env.PORTFOLIO_PROJECT_ID;

  if (found !== undefined && found !== "") {
    ids.project = found;
  } else {
    ids.project = await waitForId(page, "/projects/", pickModel, 45);

    if (ids.project === undefined) {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 120000 });

      ids.project = await waitForId(page, "/projects/", pickModel, 30);
    }
  }

  await page.goto(`${BASE_URL}/workspaces`, { waitUntil: "domcontentloaded", timeout: 120000 });

  ids.workspace = await waitForId(page, "/workspaces/", pickSpace, 30);

  if (ids.project === undefined && ids.workspace !== undefined) {
    await page.goto(`${BASE_URL}/workspaces/${ids.workspace}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    ids.project = await waitForId(page, "/projects/", pickModel, 20);
  }

  const state = await context.storageState();

  await context.close();

  return { state, ids };
}

async function openPage(page, path) {
  const response = await page.goto(`${BASE_URL}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  await page.waitForLoadState("load", { timeout: 30000 }).catch(() => undefined);

  await page
    .locator("h1")
    .first()
    .waitFor({ state: "visible", timeout: 30000 })
    .catch(() => undefined);

  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);

  await page.evaluate(() => document.fonts.ready).catch(() => undefined);

  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll(".recharts-wrapper")].every(
          (chart) => chart.querySelector("svg path, svg rect, svg circle") !== null,
        ),
      null,
      { timeout: 8000 },
    )
    .catch(() => undefined);

  await sleep(SETTLE_MS);

  return response === null ? 0 : response.status();
}

async function runAction(page, action) {
  if (action === "palette") {
    await page.keyboard.press("Control+k");

    await page.getByRole("dialog").first().waitFor({ state: "visible", timeout: 10000 });
  }

  if (action === "mobile-menu") {
    await page.getByRole("button", { name: "Open navigation menu" }).click();

    await page.getByRole("menu").first().waitFor({ state: "visible", timeout: 10000 });
  }

  await sleep(600);
}

/** A tall picture of the whole page. The window is made as tall as the page for a moment. */
async function takeFullPage(page, file) {
  const size = page.viewportSize();

  const height = await page.evaluate(() => document.documentElement.scrollHeight);

  try {
    if (height <= MAX_FULL_HEIGHT) {
      await page.setViewportSize({ width: size.width, height: Math.max(size.height, height) });

      await sleep(700);

      const settled = await page.evaluate(() => document.documentElement.scrollHeight);

      await page.screenshot({
        path: file,
        scale: "css",
        animations: "disabled",
        clip: {
          x: 0,
          y: 0,
          width: size.width,
          height: Math.min(Math.max(settled, size.height), Math.max(size.height, height)),
        },
      });
    } else {
      await page.screenshot({
        path: file,
        fullPage: true,
        scale: "css",
        animations: "disabled",
        clip: { x: 0, y: 0, width: size.width, height: MAX_FULL_HEIGHT },
      });
    }
  } finally {
    await page.setViewportSize(size);

    await sleep(300);
  }
}

async function shootOne({ page, variant, entry, ids, total, doneCount }) {
  const { page: item, number } = entry;

  const name = shotName(item, number - 1);

  const rel = `screenshots/${variant.name}/${name}.png`;

  const record = { n: number, slug: item.slug, variant: variant.name, ok: false, file: rel };

  const started = Date.now();

  const path = resolveRoute(item.route, ids);

  if (path === null) {
    record.problem = "no demo model or workspace was found for this page";

    return record;
  }

  const errors = [];

  const onError = (error) => errors.push(String(error).slice(0, 160));

  page.on("pageerror", onError);

  try {
    const status = await openPage(page, path);

    if (item.action !== undefined) {
      await runAction(page, item.action);
    }

    const info = await page.evaluate(() => ({
      h1: (document.querySelector("h1")?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120),
      title: document.title,
    }));

    const expected = item.status ?? 200;

    let problem = "";

    if (isPublicPage(item) === false && page.url().includes("/login")) {
      problem = "the app sent the browser to the sign-in page";
    } else if (status !== expected) {
      problem = `the app answered with status ${status}, not ${expected}`;
    } else if (/could not load|could not start/i.test(info.h1)) {
      problem = "the page showed its error message";
    }

    record.status = status;

    record.h1 = info.h1;

    record.title = info.title;

    if (errors.length > 0) {
      record.browserErrors = errors.length;
    }

    const folder = join(OUT, problem === "" ? "screenshots" : "problems", variant.name);

    mkdirSync(folder, { recursive: true });

    await page.screenshot({
      path: join(folder, `${name}.png`),
      scale: "device",
      animations: "disabled",
    });

    if (problem === "") {
      record.ok = true;

      if (item.full === true && variant.name === "desktop" && item.action === undefined) {
        const fullRel = `screenshots/desktop/${name}-full.png`;

        await takeFullPage(page, join(OUT, fullRel));

        record.fullFile = fullRel;
      }
    } else {
      record.problem = problem;

      record.file = `problems/${variant.name}/${name}.png`;
    }
  } catch (error) {
    record.problem = String(error?.message ?? error)
      .split("\n")[0]
      .slice(0, 200);
  } finally {
    page.off("pageerror", onError);
  }

  record.ms = Date.now() - started;

  log(
    `  [${doneCount}/${total}] ${variant.name.padEnd(7)} ${item.slug.padEnd(22)} ${record.ok ? "ok" : "PROBLEM"}  ${(record.ms / 1000).toFixed(1)}s${record.problem ? `  ${record.problem}` : ""}`,
  );

  return record;
}

function entriesFor(pages, variant, publicPart, only) {
  return pages
    .map((page, index) => ({ page, number: index + 1 }))
    .filter(({ page }) => isPublicPage(page) === publicPart)
    .filter(({ page }) => only === null || only.has(page.slug))
    .filter(({ page }) => {
      if (variant.name === "desktop") {
        return page.desktop !== false;
      }

      return page[variant.name] === true;
    });
}

async function saveExports(context, ids) {
  const jobs = [
    ["executive-report.pdf", `/api/projects/${ids.project}/export/pdf`],
    ["forecast.csv", `/api/projects/${ids.project}/export/csv`],
    ["model-backup.json", `/api/projects/${ids.project}/export/json`],
  ];

  const saved = [];

  for (const [file, path] of jobs) {
    try {
      const response = await context.request.get(`${BASE_URL}${path}`, { timeout: 120000 });

      if (response.ok() === false) {
        log(`  export  ${file}  PROBLEM  status ${response.status()}`);

        continue;
      }

      mkdirSync(join(OUT, "exports"), { recursive: true });

      writeFileSync(join(OUT, "exports", file), await response.body());

      saved.push({ file: `exports/${file}`, route: path.replace(ids.project, ":project") });

      log(`  export  ${file}  ok`);
    } catch (error) {
      log(`  export  ${file}  PROBLEM  ${String(error?.message ?? error).split("\n")[0]}`);
    }
  }

  return saved;
}

export async function capture(options = {}) {
  const pages = loadPages();

  const only = options.only === undefined ? null : new Set(options.only);

  const quick = options.quick === true;

  const server = await ensureServer(BASE_URL, log, options.start !== false);

  const results = [];

  let exported = [];

  try {
    const browser = await launchBrowser();

    try {
      const variants = VARIANTS.filter((variant) => quick === false || variant.name === "desktop");

      const plan = (publicPart) =>
        variants.map((variant) => ({
          variant,
          list: entriesFor(pages, variant, publicPart, only),
        }));

      const total = [...plan(true), ...plan(false)].reduce(
        (sum, step) => sum + step.list.length,
        0,
      );

      log(`Taking ${total} pictures (the sign-in pages first, then the pages inside the app).`);

      let done = 0;

      const run = async (steps, state, ids) => {
        for (const { variant, list } of steps) {
          if (list.length === 0) {
            continue;
          }

          const inner = await newContext(browser, variant, state);

          const page = await inner.newPage();

          page.setDefaultTimeout(60000);

          page.on("dialog", (dialog) => dialog.dismiss());

          for (const entry of list) {
            done += 1;

            results.push(await shootOne({ page, variant, entry, ids, total, doneCount: done }));
          }

          if (
            variant.name === "desktop" &&
            ids.project !== undefined &&
            quick === false &&
            only === null
          ) {
            exported = await saveExports(inner, ids);
          }

          await inner.close();
        }
      };

      await run(plan(true), undefined, {});

      if (plan(false).some((step) => step.list.length > 0)) {
        log("Signing in as the demo account...");

        const session = await signIn(browser);

        log(
          `  model: ${session.ids.project ?? "not found"}  workspace: ${session.ids.workspace ?? "not found"}`,
        );

        if (session.ids.project === undefined) {
          log(
            "  The demo model was not found. Run  pnpm demo  once, or set PORTFOLIO_PROJECT_ID to the id in the address of a model page.",
          );
        }

        await run(plan(false), session.state, session.ids);
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.stop();
  }

  return finish(results, exported);
}

function finish(results, exported) {
  const file = join(OUT, "manifest.json");

  const before = readJson(file, { shots: [], exports: [] });

  const key = (shot) => `${shot.slug}|${shot.variant}`;

  const merged = new Map(before.shots.map((shot) => [key(shot), shot]));

  for (const shot of results) {
    merged.set(key(shot), shot);
  }

  const order = VARIANTS.map((variant) => variant.name);

  const shots = [...merged.values()].sort(
    (a, b) => a.n - b.n || order.indexOf(a.variant) - order.indexOf(b.variant),
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    scale: SCALE,
    shots,
    exports: exported.length > 0 ? exported : before.exports,
  };

  saveText(file, `${JSON.stringify(manifest, null, 2)}\n`);

  const problems = results.filter((shot) => shot.ok === false);

  log("");
  log(`Pictures that worked: ${results.length - problems.length} of ${results.length}.`);

  for (const shot of problems) {
    log(`  Problem: ${shot.variant} ${shot.slug}: ${shot.problem}`);
  }

  if (problems.length > 0) {
    log(
      "  Try again with --only=name. A page that opened with an error has its picture in portfolio/problems/.",
    );
  }

  return { total: results.length, problems };
}

export function readOptions(argv) {
  const options = { start: true };

  for (const arg of argv) {
    if (arg === "--quick") {
      options.quick = true;
    }

    if (arg === "--no-start") {
      options.start = false;
    }

    if (arg.startsWith("--only=")) {
      options.only = arg
        .slice("--only=".length)
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name !== "");
    }
  }

  return options;
}

if (isMain(import.meta.url)) {
  capture(readOptions(process.argv.slice(2)))
    .then((summary) => {
      process.exitCode = summary.total > 0 && summary.problems.length === summary.total ? 1 : 0;
    })
    .catch((error) => {
      log("");
      log(`The pictures could not be taken: ${error.message}`);

      process.exitCode = 1;
    });
}
