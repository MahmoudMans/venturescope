import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Shared parts of the portfolio kit. The kit takes pictures of the running app with a browser and
 * writes texts about them. It never reads or writes the database, and it only writes inside the
 * "portfolio" folder of the project.
 */

/**
 * Finds the project folder: the folder two levels above this file. The folder name is tried in
 * three ways, because a test runner may not give a plain file address for the file. The first
 * folder that has a package.json wins. The folder where the command was started is the last try.
 */
function findRoot() {
  const candidates = [];

  if (typeof import.meta.dirname === "string") {
    candidates.push(join(import.meta.dirname, "..", ".."));
  }

  try {
    candidates.push(fileURLToPath(new URL("../../", import.meta.url)));
  } catch {
    // Not a file address. The other tries are used.
  }

  candidates.push(process.cwd());

  return candidates.find((folder) => existsSync(join(folder, "package.json"))) ?? process.cwd();
}

/** The project folder. Every path starts here, so the kit works from any folder. */
export const ROOT = findRoot();

/** Everything the kit makes is inside this folder. */
export const OUT = join(ROOT, "portfolio");

export const BASE_URL = (process.env.PORTFOLIO_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** Pixels per CSS pixel for the main pictures. 2 gives sharp pictures for a portfolio. */
export const SCALE = Math.min(3, Math.max(1, Number(process.env.PORTFOLIO_SCALE) || 2));

/** Time to wait after a page has loaded, so charts can finish drawing. */
export const SETTLE_MS = Math.max(0, Number(process.env.PORTFOLIO_SETTLE_MS) || 1800);

/** The demo account of the seed (scripts/seed/demo-config.ts). A test keeps both in step. */
export const DEMO_ACCOUNT = {
  email: process.env.PORTFOLIO_EMAIL ?? "demo@venturescope.test",
  password: process.env.PORTFOLIO_PASSWORD ?? "Orbit-Demo-2026-Plan",
  modelName: "Orbit Analytics",
};

/** The three looks of the pictures: normal desktop, dark theme and a phone. */
export const VARIANTS = [
  {
    name: "desktop",
    options: {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: SCALE,
      colorScheme: "light",
    },
  },
  {
    name: "dark",
    options: {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: SCALE,
      colorScheme: "dark",
    },
  },
  {
    name: "mobile",
    options: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: SCALE + 1,
      isMobile: true,
      hasTouch: true,
      colorScheme: "light",
    },
  },
];

/** What the owner of the portfolio writes about themselves. Created once, never overwritten. */
export const PROFILE_DEFAULTS = {
  name: "Your Name",
  role: "Full-stack developer",
  projectName: "VentureScope",
  tagline:
    "Financial planning and scenario simulation for startups, from assumptions to board pack.",
  githubUrl: "",
  liveUrl: "",
  videoUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function saveText(path, text) {
  mkdirSync(dirname(path), { recursive: true });

  writeFileSync(path, text);
}

/** True when the file was started directly (node file.mjs) and not imported. */
export function isMain(metaUrl) {
  return process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === metaUrl;
}

export function loadPages() {
  return readJson(join(ROOT, "scripts", "portfolio", "pages.json"), []);
}

export function isPublicPage(page) {
  return page.group === "Public pages";
}

/** "07-forecast": the number keeps the order of the pages.json file. */
export function shotName(page, index) {
  return `${String(index + 1).padStart(2, "0")}-${page.slug}`;
}

/** Replaces :project and :workspace in a route. Returns null when an id is missing. */
export function resolveRoute(route, ids) {
  let missing = false;

  const path = route.replace(/:(project|workspace)/g, (_match, key) => {
    if (ids[key] === undefined) {
      missing = true;
    }

    return ids[key] ?? "";
  });

  return missing ? null : path;
}

/**
 * Finds the id of the demo model in a list of links ({ href, text }). A link to a page of a model
 * looks like /projects/ID/overview. The link /projects/new is not a model. The model with the
 * wanted name is used first, otherwise the first model.
 */
export function pickProjectId(links, wantedName) {
  const models = links
    .map((link) => ({ text: link.text, id: /^\/projects\/([^/?#]+)\/[^?#]/.exec(link.href)?.[1] }))
    .filter((link) => link.id !== undefined && link.id !== "new");

  return (models.find((link) => link.text.includes(wantedName)) ?? models[0])?.id;
}

/** Finds the id of the demo workspace in a list of links, the same way. */
export function pickWorkspaceId(links, wantedName) {
  const spaces = links
    .map((link) => ({ text: link.text, id: /^\/workspaces\/([^/?#]+)$/.exec(link.href)?.[1] }))
    .filter((link) => link.id !== undefined && link.id !== "new");

  return (spaces.find((link) => link.text.includes(wantedName)) ?? spaces[0])?.id;
}

/**
 * The profile of the person who owns the portfolio. If the file does not exist it is created with
 * placeholders. A file that exists is never replaced, even when it has a mistake.
 */
export function loadProfile() {
  const file = join(OUT, "profile.json");

  if (existsSync(file) === false) {
    saveText(file, `${JSON.stringify(PROFILE_DEFAULTS, null, 2)}\n`);

    return { ...PROFILE_DEFAULTS };
  }

  let saved;

  try {
    saved = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(
      "portfolio/profile.json is not valid JSON. Fix it (every text in double quotes, commas between lines) and run this again. Nothing was changed.",
    );
  }

  return { ...PROFILE_DEFAULTS, ...saved };
}

function portOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });

    const done = (open) => {
      socket.destroy();

      resolve(open);
    };

    socket.setTimeout(1500);

    socket.once("connect", () => done(true));

    socket.once("timeout", () => done(false));

    socket.once("error", () => done(false));
  });
}

export async function isUp(base, waitMs = 4000) {
  try {
    const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(waitMs) });

    return response.ok;
  } catch {
    return false;
  }
}

async function waitUntilUp(base, seconds, isDead) {
  const end = Date.now() + seconds * 1000;

  while (Date.now() < end) {
    if (await isUp(base, 10000)) {
      return true;
    }

    if (isDead()) {
      return false;
    }

    await sleep(1000);
  }

  return false;
}

/**
 * Makes sure the app answers. A running app is used as it is. If nothing runs on this computer,
 * the kit starts "next dev" itself and stops it again at the end.
 */
export async function ensureServer(base, log, allowStart = true) {
  if (await isUp(base, 15000)) {
    log(`Using the app that already runs at ${base}`);

    return { stop() {} };
  }

  const url = new URL(base);

  const port = url.port === "" ? "80" : url.port;

  if (await portOpen(url.hostname, Number(port))) {
    log(`Something is starting at ${base}. Waiting until the app is ready...`);

    if (await waitUntilUp(base, 180, () => false)) {
      return { stop() {} };
    }

    throw new Error(
      `Something listens at ${base}, but it is not VentureScope or it does not get ready.`,
    );
  }

  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (allowStart === false || local === false) {
    throw new Error(
      `The app does not answer at ${base}. Start it with  pnpm demo  (or  pnpm dev ), then run this again.`,
    );
  }

  log(`The app is not running. Starting it for you: pnpm exec next dev -p ${port}`);

  const lines = [];

  let failed = false;

  const child = spawn("pnpm", ["exec", "next", "dev", "-p", port], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  const keep = (chunk) => {
    lines.push(...String(chunk).split("\n"));

    lines.splice(0, Math.max(0, lines.length - 40));
  };

  child.stdout.on("data", keep);

  child.stderr.on("data", keep);

  child.once("error", (error) => {
    failed = true;

    lines.push(String(error));
  });

  const stop = () => {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      // The app is already gone.
    }
  };

  process.once("exit", stop);

  process.once("SIGINT", () => {
    stop();

    process.exit(130);
  });

  const ready = await waitUntilUp(base, 180, () => failed || child.exitCode !== null);

  if (ready === false) {
    stop();

    throw new Error(
      `The app did not start. Is the database running? (pnpm demo starts it.) Last lines:\n${lines.join("\n")}`,
    );
  }

  return { stop };
}
