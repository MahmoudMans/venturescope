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

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

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

const source = read("components/app/offline-notice.tsx");

describe("the connection", () => {
  it("is read from the browser with the online and offline events, and both are removed again", () => {
    for (const name of ["online", "offline"]) {
      expect(source, name).toContain(`window.addEventListener("${name}", onChange)`);

      expect(source, name).toContain(`window.removeEventListener("${name}", onChange)`);
    }

    expect(source).toContain("navigator.onLine");

    expect(source).toContain("useSyncExternalStore(subscribe, isOnline, isOnlineOnServer)");
  });

  it("is online on the server, so the server and the browser draw the same first page", () => {
    expect(squash(source)).toContain(
      squash("function isOnlineOnServer(): boolean {\n  return true;"),
    );
  });
});

describe("the messages", () => {
  it("say in simple words that the person is offline and what that means", () => {
    expect(source).toContain("You are offline");

    expect(source).toContain("You can keep reading this page.");

    expect(source).toContain("Changes cannot be saved until you are back online.");
  });

  it("say that the person is back online, for 4 seconds, and stop the timer when they leave", () => {
    expect(source).toMatch(/>Back online<\/div>/);

    expect(source).toContain("const BACK_ONLINE_MS = 4000;");

    expect(source).toContain("window.setTimeout(() => setBackOnline(false), BACK_ONLINE_MS)");

    expect(source).toContain("window.clearTimeout(timer)");
  });

  it("do not set state at once in an effect, only in the timer", () => {
    const start = source.indexOf("useEffect(() => {");

    const end = source.indexOf("}, [backOnline]);", start);

    const effect = source.slice(start, end);

    expect(start).toBeGreaterThan(-1);

    expect(end).toBeGreaterThan(start);

    expect(effect).not.toContain("setBackOnline(true)");

    expect(effect).not.toContain("setLastOnline");
  });

  it("are in a polite live region that exists before the message", () => {
    expect(source).toContain('role="status"');

    expect(source).toContain('aria-live="polite"');
  });
});

describe("the place of the notice", () => {
  it("is once in the root layout, inside the theme, so every page has it", () => {
    const layout = read("app/layout.tsx");

    expect(layout).toContain('import { OfflineNotice } from "@/components/app/offline-notice";');

    const open = layout.indexOf("<ThemeProvider");

    const notice = layout.indexOf("<OfflineNotice />");

    const close = layout.indexOf("</ThemeProvider>");

    expect(notice).toBeGreaterThan(open);

    expect(notice).toBeLessThan(close);
  });

  it("is not drawn in another place, so a person never sees two", () => {
    const files = sourceFiles(["app", "components"], [".tsx"]).filter((file) =>
      read(file).includes("<OfflineNotice"),
    );

    expect(files).toEqual(["app/layout.tsx"]);
  });
});

describe("the space that the notice keeps for itself", () => {
  const css = read("app/globals.css");

  it("has the names that the rules in the CSS file look for", () => {
    expect(css).toContain('html:has([data-slot="offline-notice"] > [data-state])');

    expect(source).toContain('data-slot="offline-notice"');

    expect(source).toContain('data-state="offline"');

    expect(source).toContain('data-state="online"');
  });

  it("is as high as the notice with its distance from the edge, or higher", () => {
    // The notice is bottom-3 (0.75rem) and at most 6.75rem high at 400% zoom, so 7.5rem in all.
    expect(source).toContain("bottom-3");

    const space = /scroll-padding-bottom: ([\d.]+)rem;/.exec(css)?.[1];

    expect(Number(space)).toBeGreaterThanOrEqual(7.5);
  });
});

describe("the README", () => {
  it("explains the notice, the place, the tap, the screen reader, the server and the tests", () => {
    const section = readmeSection("The app tells you when you are offline");

    for (const piece of [
      "`components/app/offline-notice.tsx`",
      "`navigator.onLine`",
      "`online` and `offline` events",
      "Back online",
      "4 seconds",
      "`app/layout.tsx`",
      "`pointer-events-none`",
      "`z-[60]`",
      '`role="status"`',
      "does not save anything for later",
      "`tests/accessibility/offline-notice.test.tsx`",
      "`tests/accessibility/offline-notice-source.test.ts`",
      "the migration count stays at 17",
    ]) {
      expect(squash(section), piece).toContain(squash(piece));
    }
  });

  it("explains the space at the bottom, here and in the section about the focus", () => {
    const section = readmeSection("The app tells you when you are offline");

    for (const piece of [
      "Focus is not hidden",
      "`scroll-padding-bottom`",
      "`padding-bottom`",
      "`:has()`",
      "8rem",
      "The space goes away when the notice goes away",
      "A Tab walk through 40 fields",
    ]) {
      expect(squash(section), piece).toContain(squash(piece));
    }

    const focus = readmeSection("Keyboard focus is never hidden under the top bar");

    for (const piece of [
      "Only the offline notice (update 39) is allowed",
      "`scroll-padding-bottom: 8rem`",
      "`padding-bottom: 8rem`",
      "`:has()`",
    ]) {
      expect(squash(focus), piece).toContain(squash(piece));
    }
  });

  it("comes after the section about fields on a phone", () => {
    const first = readme.indexOf("## Fields are easy to tap on a phone");

    const second = readme.indexOf("## The app tells you when you are offline");

    const third = readme.indexOf("## Download your data");

    expect(first).toBeGreaterThan(-1);

    expect(second).toBeGreaterThan(first);

    expect(third).toBeGreaterThan(second);
  });
});
