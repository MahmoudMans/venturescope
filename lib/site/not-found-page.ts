/**
 * Small helpers for the "page not found" pages: their words, their buttons, and a "Did you mean"
 * guess for an address that has a typing mistake. They have no imports, so they are easy to test.
 */

export type NotFoundArea = "app" | "site";

export type NotFoundCopy = {
  title: string;

  description: string;
};

export type NotFoundLink = {
  href: string;

  label: string;
};

export type NotFoundActions = {
  primary: NotFoundLink;

  secondary: NotFoundLink;
};

const COPY: Record<NotFoundArea, NotFoundCopy> = {
  site: {
    title: "We could not find that page",
    description:
      "The address may have a typing mistake, or the page may have moved. Use one of the links below to get back on track.",
  },

  app: {
    title: "We could not find that page",
    description:
      "The model or page may have been deleted, or its owner may have stopped sharing it with you. Check the address, or go back to your work.",
  },
};

/** Outside the app the safe place is the home page. Inside the app it is the dashboard. */
const ACTIONS: Record<NotFoundArea, NotFoundActions> = {
  site: {
    primary: { href: "/", label: "Return home" },
    secondary: { href: "/dashboard", label: "Go to dashboard" },
  },

  app: {
    primary: { href: "/dashboard", label: "Go to dashboard" },
    secondary: { href: "/workspaces", label: "Open workspaces" },
  },
};

export function notFoundCopy(area: NotFoundArea): NotFoundCopy {
  return COPY[area];
}

export function notFoundActions(area: NotFoundArea): NotFoundActions {
  return ACTIONS[area];
}

/** Said above the guessed pages. */
export const NOT_FOUND_SUGGESTION_LABEL = "Did you mean one of these?";

/** Said at the bottom of the page inside the app, where the search is in the top bar. */
export const NOT_FOUND_SEARCH_TIP = "Tip: use the search in the top bar to find a model by name.";

/** The most pages that are offered as a guess. */
export const SUGGESTION_LIMIT = 3;

/** A longer address is not a typing mistake, so no guess is made. */
export const SUGGESTION_MAX_PATH_LENGTH = 120;

type KnownPage = NotFoundLink & {
  /**
   * Other words people type for this page. The address of the page itself is always included, and
   * a word that is only one small typing mistake away from a name needs no entry of its own.
   */
  names: readonly string[];
};

/** The pages that a person can reach by typing an address. The order breaks ties. */
const KNOWN_PAGES: readonly KnownPage[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    names: ["projects", "models", "app"],
  },

  {
    href: "/projects/new",
    label: "New model",
    names: ["new-model", "new-project", "create-model", "create-project"],
  },

  {
    href: "/workspaces",
    label: "Workspaces",
    names: ["teams"],
  },

  {
    href: "/account/profile",
    label: "Profile",
    names: ["account", "profile", "me"],
  },

  {
    href: "/account/security",
    label: "Security",
    names: ["account", "security", "password", "recovery", "recovery-key"],
  },

  {
    href: "/login",
    label: "Sign in",
    names: ["signin"],
  },

  {
    href: "/register",
    label: "Create account",
    names: ["signup", "join", "create-account"],
  },

  {
    href: "/forgot-password",
    label: "Reset your password",
    names: ["reset-password", "forgot", "reset", "recover"],
  },

  {
    href: "/help",
    label: "Help center",
    names: ["faq", "support", "contact", "docs"],
  },

  {
    href: "/privacy",
    label: "Privacy",
    names: ["privacy-policy"],
  },

  {
    href: "/terms",
    label: "Terms",
    names: ["terms-of-service", "terms-and-conditions", "tos"],
  },

  {
    href: "/demo",
    label: "Live demo",
    names: ["live-demo", "sample"],
  },

  {
    href: "/",
    label: "Home page",
    names: ["home", "index", "main"],
  },
];

/**
 * The address in a simple form that is easy to compare: no query or hash, no capital letters,
 * no slash at the start or end, and no file ending such as .html.
 */
export function normalizeRequestedPath(pathname: string): string {
  const cut = pathname.split(/[?#]/)[0] ?? "";

  let text = cut;

  try {
    text = decodeURIComponent(cut);
  } catch {
    // A broken percent sign is kept as it was typed.
  }

  return text
    .toLowerCase()
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "")
    .replace(/\.(html?|php)$/, "");
}

/**
 * How many small changes turn one text into the other. One change is a letter added, removed or
 * changed, or two neighbour letters swapped, because those are the usual typing mistakes.
 */
export function editDistance(first: string, second: string): number {
  const rows: number[][] = [];

  for (let i = 0; i <= first.length; i += 1) {
    rows.push(new Array<number>(second.length + 1).fill(0));

    rows[i][0] = i;
  }

  for (let j = 0; j <= second.length; j += 1) {
    rows[0][j] = j;
  }

  for (let i = 1; i <= first.length; i += 1) {
    for (let j = 1; j <= second.length; j += 1) {
      const cost = first[i - 1] === second[j - 1] ? 0 : 1;

      let best = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);

      if (i > 1 && j > 1 && first[i - 1] === second[j - 2] && first[i - 2] === second[j - 1]) {
        best = Math.min(best, rows[i - 2][j - 2] + 1);
      }

      rows[i][j] = best;
    }
  }

  return rows[first.length][second.length];
}

/** Dashes and underscores do not matter: "sign-in", "sign_in" and "signin" are the same word. */
function compact(text: string): string {
  return text.replace(/[-_]/g, "");
}

/** Long words may have two mistakes, medium words one, and short words must be exact. */
function allowedMistakes(name: string): number {
  if (name.length >= 8) {
    return 2;
  }

  if (name.length >= 4) {
    return 1;
  }

  return 0;
}

/**
 * The pages that a mistyped address most likely meant, best guess first. The whole address, its
 * last part and its first part are compared with the name of each page. An address that matches
 * nothing, and an empty address, give an empty list, and then the page shows no guess.
 */
export function suggestPages(pathname: string, limit: number = SUGGESTION_LIMIT): NotFoundLink[] {
  const path = normalizeRequestedPath(pathname);

  if (path.length > SUGGESTION_MAX_PATH_LENGTH) {
    return [];
  }

  const parts = path.split("/");

  const candidates = [
    ...new Set([path, parts[parts.length - 1], parts[0]].map((part) => compact(part))),
  ];

  const matches: { page: KnownPage; distance: number; order: number }[] = [];

  KNOWN_PAGES.forEach((page, order) => {
    const names = [page.href.slice(1), ...page.names]
      .map((name) => compact(name))
      .filter((name) => name.length > 0);

    // The fewest mistakes of any name and any part of the address. Too many mistakes do not count.
    const distance = Math.min(
      ...names.flatMap((name) =>
        candidates.map((candidate) => {
          const mistakes = editDistance(candidate, name);

          return mistakes <= allowedMistakes(name) ? mistakes : Number.POSITIVE_INFINITY;
        }),
      ),
    );

    if (distance !== Number.POSITIVE_INFINITY) {
      matches.push({ page, distance, order });
    }
  });

  matches.sort((a, b) => a.distance - b.distance || a.order - b.order);

  return matches
    .slice(0, Math.max(0, limit))
    .map(({ page }) => ({ href: page.href, label: page.label }));
}
