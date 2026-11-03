/**
 * Small helpers for the pages that are shown when something breaks.
 * They have no imports, so they also work inside the page for very serious errors.
 */

export type ErrorPageArea = "app" | "site" | "global";

export type ErrorPageCopy = {
  title: string;

  description: string;

  homeHref: string;

  homeLabel: string;
};

/** The longest reference that is shown. Next.js makes short numbers, so this is only a safety limit. */
export const ERROR_REFERENCE_MAX_LENGTH = 64;

/** Said under the reference, so a person knows what to do with it. */
export const ERROR_REFERENCE_HINT =
  "If you ask for help, give this reference to the person who runs this VentureScope service.";

const COPY: Record<ErrorPageArea, ErrorPageCopy> = {
  app: {
    title: "This page could not load",
    description:
      "Something went wrong while the page was prepared. Your data is safe. Try again, and if it keeps happening, go back to your dashboard.",
    homeHref: "/dashboard",
    homeLabel: "Go to dashboard",
  },

  site: {
    title: "This page could not load",
    description:
      "Something went wrong while the page was prepared. Try again, or go back to the home page.",
    homeHref: "/",
    homeLabel: "Return home",
  },

  global: {
    title: "VentureScope could not start",
    description:
      "A serious problem stopped the page from loading. Try again. If it keeps happening, come back in a few minutes.",
    homeHref: "/",
    homeLabel: "Return home",
  },
};

export function errorPageCopy(area: ErrorPageArea): ErrorPageCopy {
  return COPY[area];
}

/**
 * The reference code of an error, or null. Next.js adds it as `digest` to an error that came from
 * the server, and the same code is written in the server log. Only a short code made of letters,
 * digits, dots, dashes and underscores is accepted, so an empty code is refused too. The message
 * of the error is never used, because it can hold details that a visitor must not see.
 */
export function errorReference(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const digest = (error as { digest?: unknown }).digest;

  if (typeof digest !== "string") {
    return null;
  }

  const code = digest.trim();

  if (code.length > ERROR_REFERENCE_MAX_LENGTH) {
    return null;
  }

  return /^[A-Za-z0-9._-]+$/.test(code) ? code : null;
}

/**
 * Dark or light for the page of a very serious error. That page cannot use the theme switch of the
 * app, so it follows the saved choice ("dark" or "light") and otherwise the system setting.
 */
export function resolveDarkTheme(stored: string | null, systemPrefersDark: boolean): boolean {
  if (stored === "dark") {
    return true;
  }

  if (stored === "light") {
    return false;
  }

  return systemPrefersDark;
}
