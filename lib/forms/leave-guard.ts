/** What the browser asks when a person leaves a page with changes that are not saved. */
export const UNSAVED_MESSAGE =
  "You have unsaved changes. If you leave this page, you lose them. Leave anyway?";

/** After a person agrees to leave, the browser must not ask a second time for this long. */
export const CONFIRMED_LEAVE_MS = 3000;

/** A link such as mailto: makes some browsers ask about leaving. For this long they must not ask. */
export const APP_LINK_QUIET_MS = 1000;

/** The forms that have changes that are not saved. One page can have more than one form. */
const dirtyForms = new Set<object>();

let confirmedAt = Number.NEGATIVE_INFINITY;

let quietUntil = Number.NEGATIVE_INFINITY;

/**
 * The attribute that the page element (html) has while a form has changes that are not saved. The
 * CSS file uses it to switch off pull to refresh on a phone: a swipe down at the top of the page
 * would reload the page and lose the changes.
 */
export const UNSAVED_ATTRIBUTE = "data-unsaved-changes";

/** Puts the attribute on the page element, or takes it away, to match the forms. */
function showUnsavedOnPage(): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  if (dirtyForms.size > 0) {
    root.setAttribute(UNSAVED_ATTRIBUTE, "true");
  } else {
    root.removeAttribute(UNSAVED_ATTRIBUTE);
  }
}

/** Tells the guard that a form has (or no longer has) changes that are not saved. */
export function markUnsaved(owner: object, dirty: boolean): void {
  if (dirty) {
    dirtyForms.add(owner);
  } else {
    dirtyForms.delete(owner);
  }

  showUnsavedOnPage();
}

export function hasUnsavedChanges(): boolean {
  return dirtyForms.size > 0;
}

/** Forgets everything. Used by the tests. */
export function resetLeaveGuard(): void {
  dirtyForms.clear();

  confirmedAt = Number.NEGATIVE_INFINITY;

  quietUntil = Number.NEGATIVE_INFINITY;

  showUnsavedOnPage();
}

type Asker = (message: string) => boolean;

function askInBrowser(message: string): boolean {
  return window.confirm(message);
}

/**
 * For a page change that is made with code, such as the search bar. True when the person may go on:
 * there is nothing to lose, or the person agreed to lose it.
 */
export function confirmDiscardChanges(
  ask: Asker = askInBrowser,
  now: () => number = Date.now,
): boolean {
  if (hasUnsavedChanges() === false) {
    return true;
  }

  if (ask(UNSAVED_MESSAGE) === false) {
    return false;
  }

  confirmedAt = now();

  return true;
}

type LinkLike = {
  href: string;
  target: string;
  hasDownload: boolean;
};

/**
 * True when a click on this link takes the person away from the page. A link that opens a new tab
 * or a download, a link to the same page (or to a place on it) and a link such as mailto: do not.
 */
export function linkLeavesPage(link: LinkLike, currentHref: string): boolean {
  if (link.hasDownload || (link.target !== "" && link.target !== "_self")) {
    return false;
  }

  let next: URL;

  let here: URL;

  try {
    next = new URL(link.href, currentHref);

    here = new URL(currentHref);
  } catch {
    return false;
  }

  if (next.protocol !== "http:" && next.protocol !== "https:") {
    return false;
  }

  return (
    next.origin !== here.origin || next.pathname !== here.pathname || next.search !== here.search
  );
}

const APP_PROTOCOLS = new Set(["mailto:", "tel:", "sms:"]);

/** True for a link that opens another app (the mail program, the phone) and not another page. */
export function opensAnotherApp(href: string): boolean {
  try {
    return APP_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

/** The part of window and document that the guard uses. A real window and document fit. */
export type GuardEnvironment = {
  win: Pick<Window, "addEventListener" | "removeEventListener" | "confirm" | "location">;
  doc: Pick<Document, "addEventListener" | "removeEventListener">;
  now: () => number;
};

function browserEnvironment(): GuardEnvironment | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  return { win: window, doc: document, now: Date.now };
}

function anchorOf(target: unknown): Element | null {
  const element = target as { closest?: (selector: string) => Element | null } | null;

  if (element === null || typeof element.closest !== "function") {
    return null;
  }

  return element.closest("a[href]");
}

let installed = 0;

let removeListeners: () => void = () => undefined;

/**
 * Watches the whole page while a form has changes that are not saved. A click on a link that leaves
 * the page asks first, and closing or reloading the tab makes the browser ask. It is safe to call
 * from many forms: the listeners are added once and removed with the last form. Returns a function
 * that ends this call.
 */
export function installLeaveGuard(
  environment: GuardEnvironment | null = browserEnvironment(),
): () => void {
  if (environment === null) {
    return () => undefined;
  }

  const { win, doc, now } = environment;

  if (installed === 0) {
    const onClick = (event: MouseEvent) => {
      if (hasUnsavedChanges() === false || event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = anchorOf(event.target) as HTMLAnchorElement | null;

      if (anchor === null) {
        return;
      }

      // A link inside a drawing (SVG) has no text address, and it is left alone.
      if (typeof anchor.href !== "string") {
        return;
      }

      const link = {
        href: anchor.href,
        target: anchor.target,
        hasDownload: anchor.hasAttribute("download"),
      };

      if (linkLeavesPage(link, win.location.href) === false) {
        if (opensAnotherApp(link.href)) {
          quietUntil = now() + APP_LINK_QUIET_MS;
        }

        return;
      }

      if (confirmDiscardChanges(win.confirm.bind(win), now) === false) {
        event.preventDefault();

        event.stopPropagation();
      }
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        hasUnsavedChanges() === false ||
        now() - confirmedAt < CONFIRMED_LEAVE_MS ||
        now() < quietUntil
      ) {
        return;
      }

      event.preventDefault();

      event.returnValue = "";
    };

    // The click is caught before React sees it, so a Next.js link cannot start the page change.
    doc.addEventListener("click", onClick, true);

    win.addEventListener("beforeunload", onBeforeUnload);

    removeListeners = () => {
      doc.removeEventListener("click", onClick, true);

      win.removeEventListener("beforeunload", onBeforeUnload);
    };
  }

  installed += 1;

  let ended = false;

  return () => {
    if (ended) {
      return;
    }

    ended = true;

    installed -= 1;

    if (installed === 0) {
      removeListeners();

      removeListeners = () => undefined;
    }
  };
}
