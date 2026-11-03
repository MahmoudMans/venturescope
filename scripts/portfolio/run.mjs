import { capture, readOptions } from "./capture.mjs";
import { writeTexts } from "./write-texts.mjs";

/**
 * pnpm portfolio: takes the pictures of the running app (starting it if needed), then writes the
 * texts. Options are passed on to the picture step, for example  pnpm portfolio --quick
 */

try {
  const summary = await capture(readOptions(process.argv.slice(2)));

  process.stdout.write("\nWriting the texts...\n");

  writeTexts();

  process.stdout.write("\nDone. Open portfolio/gallery.html to look at the pictures.\n");

  process.exitCode = summary.total > 0 && summary.problems.length === summary.total ? 1 : 0;
} catch (error) {
  process.stdout.write(`\nThe portfolio kit stopped: ${error.message}\n`);

  process.exitCode = 1;
}
