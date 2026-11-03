import { existsSync } from "node:fs";
import { join } from "node:path";

import { OUT, ROOT, isMain, loadPages, loadProfile, readJson, saveText } from "./common.mjs";
import { buildDocuments, collectFacts } from "./docs.mjs";

/**
 * Writes the texts of the portfolio into the portfolio folder: the README, the gallery page and
 * the files in portfolio/texts. It can be run as often as you like, for example after you change
 * portfolio/profile.json. It does not need the app, the database or the network.
 */

export function writeTexts(log = (line) => process.stdout.write(`${line}\n`)) {
  const profile = loadProfile();

  const documents = buildDocuments({
    profile,
    pages: loadPages(),
    facts: collectFacts(ROOT),
    manifest: readJson(join(OUT, "manifest.json"), { shots: [], exports: [] }),
    has: (path) => existsSync(join(OUT, path)),
    today: new Date().toISOString().slice(0, 10),
  });

  for (const [path, text] of Object.entries(documents)) {
    saveText(join(OUT, path), text);

    log(`  wrote   portfolio/${path}`);
  }

  if (profile.name === "Your Name") {
    log("");
    log("Tip: write your name and links in portfolio/profile.json, then run  pnpm portfolio:texts");
  }

  return Object.keys(documents);
}

if (isMain(import.meta.url)) {
  try {
    writeTexts();
  } catch (error) {
    process.stdout.write(`The texts could not be written: ${error.message}\n`);

    process.exitCode = 1;
  }
}
