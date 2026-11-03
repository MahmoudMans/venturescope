import { describe, expect, it } from "vitest";

import { markUnsaved, resetLeaveGuard, UNSAVED_ATTRIBUTE } from "@/lib/forms/leave-guard";

/** A stand-in for the page element (html). It keeps its attributes. */
function makeRoot() {
  const attributes = new Map<string, string>();

  return {
    attributes,
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
    removeAttribute(name: string) {
      attributes.delete(name);
    },
  };
}

type Root = ReturnType<typeof makeRoot>;

const scope = globalThis as unknown as { document?: unknown };

/** Runs a test on a page that is a stand-in, and puts everything back when the test ends. */
function onPage(test: (root: Root) => void): () => void {
  return () => {
    const root = makeRoot();

    scope.document = { documentElement: root };

    resetLeaveGuard();

    try {
      test(root);
    } finally {
      resetLeaveGuard();

      delete scope.document;
    }
  };
}

describe("the sign on the page for changes that are not saved", () => {
  it("is the attribute data-unsaved-changes", () => {
    expect(UNSAVED_ATTRIBUTE).toBe("data-unsaved-changes");
  });

  it(
    "is not there when no form has changes",
    onPage((root) => {
      expect(root.attributes.has(UNSAVED_ATTRIBUTE)).toBe(false);

      markUnsaved({}, false);

      expect(root.attributes.has(UNSAVED_ATTRIBUTE)).toBe(false);
    }),
  );

  it(
    "is put on the page when a form has changes that are not saved",
    onPage((root) => {
      markUnsaved({}, true);

      expect(root.attributes.get(UNSAVED_ATTRIBUTE)).toBe("true");
    }),
  );

  it(
    "is taken away when the form is clean again",
    onPage((root) => {
      const form = {};

      markUnsaved(form, true);

      markUnsaved(form, false);

      expect(root.attributes.has(UNSAVED_ATTRIBUTE)).toBe(false);
    }),
  );

  it(
    "stays while one of two forms still has changes",
    onPage((root) => {
      const first = {};

      const second = {};

      markUnsaved(first, true);

      markUnsaved(second, true);

      markUnsaved(first, false);

      expect(root.attributes.get(UNSAVED_ATTRIBUTE)).toBe("true");

      markUnsaved(second, false);

      expect(root.attributes.has(UNSAVED_ATTRIBUTE)).toBe(false);
    }),
  );

  it(
    "is taken away when the guard forgets everything",
    onPage((root) => {
      markUnsaved({}, true);

      resetLeaveGuard();

      expect(root.attributes.has(UNSAVED_ATTRIBUTE)).toBe(false);
    }),
  );

  it(
    "does no harm on the server, where there is no page",
    onPage(() => {
      delete scope.document;

      expect(() => markUnsaved({}, true)).not.toThrow();

      expect(() => resetLeaveGuard()).not.toThrow();
    }),
  );
});
