import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  APP_LINK_QUIET_MS,
  CONFIRMED_LEAVE_MS,
  confirmDiscardChanges,
  type GuardEnvironment,
  hasUnsavedChanges,
  installLeaveGuard,
  linkLeavesPage,
  markUnsaved,
  opensAnotherApp,
  resetLeaveGuard,
  UNSAVED_MESSAGE,
} from "@/lib/forms/leave-guard";

const HERE = "https://app.test/projects/p1/assumptions";

type Listener = (event: unknown) => void;

type Registered = { type: string; listener: Listener; capture: boolean | undefined };

/** A stand-in for window or document. It keeps its listeners and can send an event to them. */
function makeTarget() {
  const registered: Registered[] = [];

  return {
    registered,
    addEventListener(type: string, listener: Listener, capture?: boolean) {
      registered.push({ type, listener, capture });
    },
    removeEventListener(type: string, listener: Listener, capture?: boolean) {
      const index = registered.findIndex(
        (entry) => entry.type === type && entry.listener === listener && entry.capture === capture,
      );

      if (index > -1) {
        registered.splice(index, 1);
      }
    },
    send(type: string, event: unknown) {
      registered.filter((entry) => entry.type === type).forEach((entry) => entry.listener(event));
    },
  };
}

const releases: (() => void)[] = [];

function setUp(answer = false) {
  const doc = makeTarget();

  const win = makeTarget();

  const confirm = vi.fn(() => answer);

  const clock = { now: 100000 };

  const environment = {
    win: Object.assign(win, { confirm, location: { href: HERE } }),
    doc,
    now: () => clock.now,
  };

  const install = () => {
    const release = installLeaveGuard(environment as unknown as GuardEnvironment);

    releases.push(release);

    return release;
  };

  return { doc, win, confirm, clock, install };
}

type LinkOptions = { href: string; target?: string; download?: boolean };

/** A click on something inside a link. */
function clickOnLink(options: LinkOptions, extra: Record<string, unknown> = {}) {
  const anchor = {
    href: options.href,
    target: options.target ?? "",
    hasAttribute: (name: string) => name === "download" && options.download === true,
  };

  return {
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    target: { closest: () => anchor },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...extra,
  };
}

beforeEach(() => {
  releases.splice(0).forEach((release) => release());

  resetLeaveGuard();
});

describe("linkLeavesPage", () => {
  const leaves = (href: string, target = "", hasDownload = false) =>
    linkLeavesPage({ href, target, hasDownload }, HERE);

  it("is true for another page of the app, also with a short address", () => {
    expect(leaves("https://app.test/dashboard")).toBe(true);

    expect(leaves("/projects/p2/assumptions")).toBe(true);
  });

  it("is true for a page on another site", () => {
    expect(leaves("https://other.test/projects/p1/assumptions")).toBe(true);
  });

  it("is true for the same page with another search part", () => {
    expect(leaves(`${HERE}?scenario=s2`)).toBe(true);
  });

  it("is false for the same page and for a place on the same page", () => {
    expect(leaves(HERE)).toBe(false);

    expect(leaves(`${HERE}#revenue`)).toBe(false);

    expect(leaves("#revenue")).toBe(false);
  });

  it("is false for a new tab and for a download", () => {
    expect(leaves("https://app.test/dashboard", "_blank")).toBe(false);

    expect(leaves("https://app.test/export.zip", "", true)).toBe(false);
  });

  it("is true when the link names its own window", () => {
    expect(leaves("https://app.test/dashboard", "_self")).toBe(true);
  });

  it("is false for links that are not pages", () => {
    expect(leaves("mailto:help@app.test")).toBe(false);

    expect(leaves("tel:+21611222333")).toBe(false);

    expect(leaves("javascript:void(0)")).toBe(false);
  });

  it("is false when the address cannot be read", () => {
    expect(linkLeavesPage({ href: "/x", target: "", hasDownload: false }, "not an address")).toBe(
      false,
    );
  });
});

describe("opensAnotherApp", () => {
  it("is true for a mail, a phone and a text message link", () => {
    expect(opensAnotherApp("mailto:team@example.com")).toBe(true);

    expect(opensAnotherApp("tel:+21612345678")).toBe(true);

    expect(opensAnotherApp("sms:+21612345678")).toBe(true);
  });

  it("is false for a page, a place on a page and a text that is not an address", () => {
    expect(opensAnotherApp("https://app.test/dashboard")).toBe(false);

    expect(opensAnotherApp("http://app.test/")).toBe(false);

    expect(opensAnotherApp("#revenue")).toBe(false);

    expect(opensAnotherApp("")).toBe(false);
  });
});

describe("the list of forms with unsaved changes", () => {
  it("is empty at the start", () => {
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("knows each form on its own", () => {
    const first = {};

    const second = {};

    markUnsaved(first, true);

    markUnsaved(second, true);

    markUnsaved(first, true);

    markUnsaved(first, false);

    expect(hasUnsavedChanges()).toBe(true);

    markUnsaved(second, false);

    expect(hasUnsavedChanges()).toBe(false);
  });

  it("forgets everything with resetLeaveGuard", () => {
    markUnsaved({}, true);

    resetLeaveGuard();

    expect(hasUnsavedChanges()).toBe(false);
  });
});

describe("confirmDiscardChanges", () => {
  it("lets the person go without a question when nothing is unsaved", () => {
    const ask = vi.fn(() => false);

    expect(confirmDiscardChanges(ask)).toBe(true);

    expect(ask).not.toHaveBeenCalled();
  });

  it("asks the question and stops when the person stays", () => {
    markUnsaved({}, true);

    const ask = vi.fn(() => false);

    expect(confirmDiscardChanges(ask)).toBe(false);

    expect(ask).toHaveBeenCalledWith(UNSAVED_MESSAGE);
  });

  it("lets the person go when the person agrees", () => {
    markUnsaved({}, true);

    expect(confirmDiscardChanges(() => true)).toBe(true);
  });

  it("has a message in simple words", () => {
    expect(UNSAVED_MESSAGE).toBe(
      "You have unsaved changes. If you leave this page, you lose them. Leave anyway?",
    );
  });
});

describe("installLeaveGuard", () => {
  it("does nothing outside a browser", () => {
    expect(() => installLeaveGuard(null)()).not.toThrow();
  });

  it("does nothing when the default environment has no page, or a window without a document", () => {
    const scope = globalThis as unknown as Record<string, unknown>;

    expect(() => installLeaveGuard()()).not.toThrow();

    const had = "window" in scope;

    const before = scope.window;

    scope.window = {};

    try {
      expect(() => installLeaveGuard()()).not.toThrow();
    } finally {
      if (had) {
        scope.window = before;
      } else {
        delete scope.window;
      }
    }
  });

  it("listens to clicks before React (capture) and to the closing of the tab", () => {
    const { doc, win, install } = setUp();

    install();

    expect(doc.registered.map((entry) => [entry.type, entry.capture])).toEqual([["click", true]]);

    expect(win.registered.map((entry) => entry.type)).toEqual(["beforeunload"]);
  });

  it("adds the listeners once for many forms and removes them with the last form", () => {
    const { doc, win, install } = setUp();

    const first = install();

    const second = install();

    expect(doc.registered).toHaveLength(1);

    expect(win.registered).toHaveLength(1);

    first();

    first();

    expect(doc.registered).toHaveLength(1);

    second();

    expect(doc.registered).toHaveLength(0);

    expect(win.registered).toHaveLength(0);

    install();

    expect(doc.registered).toHaveLength(1);
  });

  it("asks before a click on a link that leaves the page, and stops the click when the person stays", () => {
    const { doc, confirm, install } = setUp(false);

    install();

    markUnsaved({}, true);

    const click = clickOnLink({ href: "https://app.test/dashboard" });

    doc.send("click", click);

    expect(confirm).toHaveBeenCalledWith(UNSAVED_MESSAGE);

    expect(click.preventDefault).toHaveBeenCalledTimes(1);

    expect(click.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it("lets the click go on when the person agrees to leave", () => {
    const { doc, confirm, install } = setUp(true);

    install();

    markUnsaved({}, true);

    const click = clickOnLink({ href: "https://app.test/dashboard" });

    doc.send("click", click);

    expect(confirm).toHaveBeenCalledTimes(1);

    expect(click.preventDefault).not.toHaveBeenCalled();

    expect(click.stopPropagation).not.toHaveBeenCalled();
  });

  it("does not ask when nothing is unsaved", () => {
    const { doc, confirm, install } = setUp(false);

    install();

    const click = clickOnLink({ href: "https://app.test/dashboard" });

    doc.send("click", click);

    expect(confirm).not.toHaveBeenCalled();

    expect(click.preventDefault).not.toHaveBeenCalled();
  });

  it("does not ask for a link that stays on the page, opens a new tab or downloads", () => {
    const { doc, confirm, install } = setUp(false);

    install();

    markUnsaved({}, true);

    for (const options of [
      { href: HERE },
      { href: `${HERE}#expenses` },
      { href: "https://app.test/dashboard", target: "_blank" },
      { href: "https://app.test/export.zip", download: true },
    ]) {
      doc.send("click", clickOnLink(options));
    }

    expect(confirm).not.toHaveBeenCalled();
  });

  it("does not ask for a click that opens a link in a new tab or is not a plain left click", () => {
    const { doc, confirm, install } = setUp(false);

    install();

    markUnsaved({}, true);

    const link = { href: "https://app.test/dashboard" };

    for (const extra of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
      { button: 2 },
      { defaultPrevented: true },
    ]) {
      doc.send("click", clickOnLink(link, extra));
    }

    expect(confirm).not.toHaveBeenCalled();
  });

  it("looks for the nearest link that has an address", () => {
    const { doc, install } = setUp(false);

    install();

    markUnsaved({}, true);

    const event = clickOnLink({ href: "https://app.test/dashboard" });

    const closest = vi.fn(() => ({
      href: "https://app.test/dashboard",
      target: "",
      hasAttribute: () => false,
    }));

    event.target = { closest };

    doc.send("click", event);

    expect(closest).toHaveBeenCalledWith("a[href]");
  });

  it("does not ask for a click that is not on a link", () => {
    const { doc, confirm, install } = setUp(false);

    install();

    markUnsaved({}, true);

    doc.send("click", clickOnLink({ href: "/x" }, { target: { closest: () => null } }));

    doc.send("click", clickOnLink({ href: "/x" }, { target: {} }));

    doc.send("click", clickOnLink({ href: "/x" }, { target: null }));

    expect(confirm).not.toHaveBeenCalled();
  });

  it("leaves a link that has no text address alone", () => {
    const { doc, confirm, install } = setUp(false);

    install();

    markUnsaved({}, true);

    const drawing = { href: { baseVal: "/x" }, target: "", hasAttribute: () => false };

    doc.send("click", clickOnLink({ href: "/x" }, { target: { closest: () => drawing } }));

    expect(confirm).not.toHaveBeenCalled();
  });

  it("makes the browser ask when the tab is closed or reloaded and a form is unsaved", () => {
    const { win, install } = setUp();

    install();

    markUnsaved({}, true);

    const event = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);

    expect(event.returnValue).toBe("");
  });

  it("lets the tab close when nothing is unsaved", () => {
    const { win, install } = setUp();

    install();

    const event = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", event);

    expect(event.preventDefault).not.toHaveBeenCalled();

    expect(event.returnValue).toBeUndefined();
  });

  it("does not ask a second time after the person agreed to leave", () => {
    const { doc, win, clock, install } = setUp(true);

    install();

    markUnsaved({}, true);

    doc.send("click", clickOnLink({ href: "https://other.test/" }));

    const soon = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", soon);

    expect(soon.preventDefault).not.toHaveBeenCalled();

    clock.now += CONFIRMED_LEAVE_MS + 1;

    const later = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", later);

    expect(later.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("does not let the browser ask when the person clicks a mail link, and asks again later", () => {
    const { doc, win, clock, confirm, install } = setUp(false);

    install();

    markUnsaved({}, true);

    doc.send("click", clickOnLink({ href: "mailto:team@example.com" }));

    const soon = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", soon);

    expect(soon.preventDefault).not.toHaveBeenCalled();

    expect(confirm).not.toHaveBeenCalled();

    clock.now += APP_LINK_QUIET_MS + 1;

    const later = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", later);

    expect(later.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("does not stay quiet after a click on a link to another page or a place on the page", () => {
    const { doc, win, install } = setUp(false);

    install();

    markUnsaved({}, true);

    doc.send("click", clickOnLink({ href: `${HERE}#expenses` }));

    const event = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("forgets the quiet time when the guard is reset", () => {
    const { doc, win, install } = setUp(false);

    install();

    markUnsaved({}, true);

    doc.send("click", clickOnLink({ href: "tel:+21612345678" }));

    resetLeaveGuard();

    markUnsaved({}, true);

    const event = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("does not stay quiet for a mail link that was clicked while nothing was unsaved", () => {
    const { doc, win, install } = setUp(false);

    install();

    doc.send("click", clickOnLink({ href: "mailto:team@example.com" }));

    markUnsaved({}, true);

    const event = { preventDefault: vi.fn(), returnValue: undefined as unknown };

    win.send("beforeunload", event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
});
