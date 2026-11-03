/**
 * Where a person goes after signing in. The address comes from the browser, so it is checked
 * with a strict list: only pages inside the app are allowed, and nothing else.
 */

/** The page a person sees after signing in when no other page was asked for. */
export const DEFAULT_RETURN_PATH = "/dashboard";

/** The request header where the proxy puts the page that was asked for. */
export const RETURN_PATH_HEADER = "x-venturescope-path";

const MAX_LENGTH = 400;

/** The first part of the address of every page that a person can come back to. */
const PAGE_ROOTS = ["dashboard", "projects", "workspaces", "account", "invite"];

/** Letters, digits and a few signs. No spaces, no quotes, no backslash and no "#". */
const SAFE_CHARACTERS = /^\/[A-Za-z0-9\-._~%/?&=+:@,]*$/;

/** Only used to read the address. It is never opened. */
const READING_BASE = "http://venturescope.invalid";

/**
 * Returns the address when it is a page inside the app, and nothing when it is anything else:
 * another website, an address with "//" or "..", an API address, the sign-in pages, a long text.
 * The "_rsc" part that Next.js adds when a page is opened from a link is removed.
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > MAX_LENGTH) {
    return null;
  }

  if (SAFE_CHARACTERS.test(value) === false || value.startsWith("//")) {
    return null;
  }

  const cut = value.indexOf("?");

  const path = cut === -1 ? value : value.slice(0, cut);

  const query = cut === -1 ? "" : value.slice(cut + 1);

  let reading: URL;

  try {
    reading = new URL(path, READING_BASE);
  } catch {
    return null;
  }

  // A path that the browser would change (for example "/projects/../login") is not accepted.
  if (reading.origin !== READING_BASE || reading.pathname !== path) {
    return null;
  }

  const segments = path.split("/");

  if (PAGE_ROOTS.includes(segments[1]) === false) {
    return null;
  }

  if (segments.slice(1, -1).includes("")) {
    return null;
  }

  if (segments[1] === "invite" && (segments[2] ?? "") === "") {
    return null;
  }

  const pairs = query
    .split("&")
    .filter((pair) => pair !== "" && pair !== "_rsc" && pair.startsWith("_rsc=") === false);

  return pairs.length === 0 ? path : `${path}?${pairs.join("&")}`;
}

/**
 * The address of the sign-in page or the create-account page. It carries the page the person
 * wanted, except the dashboard, which is where everybody goes anyway.
 */
export function authPageHref(
  page: "/login" | "/register" | "/forgot-password",
  options: { security?: string; next?: unknown } = {},
): string {
  const parts: string[] = [];

  if (options.security !== undefined) {
    parts.push(`security=${encodeURIComponent(options.security)}`);
  }

  const next = safeReturnPath(options.next);

  if (next !== null && next !== DEFAULT_RETURN_PATH) {
    parts.push(`next=${encodeURIComponent(next)}`);
  }

  return parts.length === 0 ? page : `${page}?${parts.join("&")}`;
}

/** A few words for the page the person wanted, or nothing when there is none. */
export function describeReturnTarget(path: string | null): string | null {
  if (path === null) {
    return null;
  }

  const onlyPath = path.split("?")[0];

  const root = onlyPath.split("/")[1];

  switch (root) {
    case "invite":
      return "your workspace invitation";

    case "projects":
      return onlyPath === "/projects/new" ? "the new model page" : "your financial model";

    case "workspaces":
      return onlyPath === "/workspaces" || onlyPath === "/workspaces/"
        ? "your workspaces"
        : "your workspace";

    case "account":
      return "your account";

    default:
      return "your dashboard";
  }
}

/** The line under the title of the sign-in page. */
export function describeLoginIntro(path: string | null): string {
  const target = describeReturnTarget(path);

  return target === null
    ? "Sign in to continue to your VentureScope workspace."
    : `Sign in to open ${target}.`;
}

/** The line under the title of the reset-password page. */
export function describeResetIntro(path: string | null): string {
  const base =
    "VentureScope sends no emails, so a reset needs your recovery key. You can show it in Account, then Security, while you are signed in.";

  const target = describeReturnTarget(path);

  return target === null ? base : `${base} After the reset, sign in to open ${target}.`;
}

/** The line under the title of the create-account page. */
export function describeRegisterIntro(path: string | null): string {
  if (path !== null && path.startsWith("/invite/")) {
    return "Create your account with the email address that was invited. Then you go straight back to your invitation.";
  }

  const target = describeReturnTarget(path);

  return target === null
    ? "Start building financial models and scenario forecasts."
    : `Create your account, then sign in to open ${target}.`;
}
