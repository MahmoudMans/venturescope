import { beforeEach, describe, expect, it, vi } from "vitest";

// The hook is called outside a component here, so the test gives it a name without "use".
import { useUnsavedChangesWarning as callWarningHook } from "@/components/forms/use-unsaved-changes-warning";
import { hasUnsavedChanges, resetLeaveGuard } from "@/lib/forms/leave-guard";

const fake = vi.hoisted(() => ({
  refs: [] as { current: unknown }[],
  calls: 0,
  effects: [] as { run: () => unknown; deps: unknown[] }[],
  states: [] as unknown[],
}));

vi.mock("react", () => ({
  useRef: (initial: unknown) => {
    const ref = fake.refs[fake.calls] ?? { current: initial };

    fake.refs[fake.calls] = ref;

    fake.calls += 1;

    return ref;
  },
  useState: (initial: unknown) => [initial, (value: unknown) => fake.states.push(value)],
  useEffect: (run: () => unknown, deps: unknown[]) => {
    fake.effects.push({ run, deps });
  },
}));

type Box = { tagName: string; type: string; name: string; value: string; checked: boolean };

function textBox(name: string, value: string): Box {
  return { tagName: "INPUT", type: "text", name, value, checked: false };
}

type Listener = (event?: unknown) => void;

function makeForm(elements: Box[]) {
  const listeners: Record<string, Listener[]> = {};

  return {
    elements,
    listeners,
    requestSubmit: () => undefined,
    addEventListener(type: string, listener: Listener) {
      listeners[type] = [...(listeners[type] ?? []), listener];
    },
    removeEventListener(type: string, listener: Listener) {
      listeners[type] = (listeners[type] ?? []).filter((entry) => entry !== listener);
    },
    send(type: string, event: unknown = {}) {
      (listeners[type] ?? []).forEach((listener) => listener(event));
    },
  };
}

type Timer = { run: () => void; cleared: boolean; wait: unknown };

/** Runs a test with timers that wait until the test lets them run. */
function withTimers(test: (timers: Timer[]) => void) {
  const timers: Timer[] = [];

  const realSet = globalThis.setTimeout;

  const realClear = globalThis.clearTimeout;

  globalThis.setTimeout = ((run: () => void, wait: unknown) => {
    timers.push({ run, cleared: false, wait });

    return timers.length;
  }) as unknown as typeof setTimeout;

  globalThis.clearTimeout = ((id: number) => {
    timers[id - 1].cleared = true;
  }) as unknown as typeof clearTimeout;

  try {
    test(timers);
  } finally {
    globalThis.setTimeout = realSet;

    globalThis.clearTimeout = realClear;
  }
}

function setUp(form: unknown, savedAt: unknown) {
  const formRef = { current: form } as { current: HTMLFormElement | null };

  const dirty = callWarningHook(formRef, savedAt);

  return { dirty, watch: fake.effects[0], saved: fake.effects[1], formRef };
}

beforeEach(() => {
  fake.refs = [];

  fake.calls = 0;

  fake.effects = [];

  fake.states = [];

  resetLeaveGuard();
});

describe("useUnsavedChangesWarning", () => {
  it("starts with a form that has nothing unsaved", () => {
    expect(setUp(makeForm([]), null).dirty).toBe(false);
  });

  it("starts to watch again only when the ref of the form changes", () => {
    const { watch, formRef } = setUp(makeForm([]), null);

    expect(watch.deps).toEqual([formRef]);
  });

  it("does not fail when the form is not there yet", () => {
    const { watch, saved } = setUp(null, { status: "success" });

    expect(watch.run()).toBeUndefined();

    withTimers(() => {
      expect(() => saved.run()).not.toThrow();
    });
  });

  it("watches the form and stops when the page closes", () => {
    const form = makeForm([textBox("cash", "100")]);

    const { watch } = setUp(form, null);

    const cleanup = watch.run() as () => void;

    expect(Object.keys(form.listeners).sort()).toEqual([
      "change",
      "click",
      "input",
      "keydown",
      "submit",
    ]);

    cleanup();

    for (const type of Object.keys(form.listeners)) {
      expect(form.listeners[type], type).toEqual([]);
    }

    expect((fake.refs[0] as { current: unknown }).current).toBeNull();
  });

  it("says that the form is dirty, tells the guard, and tells it again when the form is clean", () => {
    const cash = textBox("cash", "100");

    const form = makeForm([cash]);

    const { watch } = setUp(form, null);

    const cleanup = watch.run() as () => void;

    cash.value = "250";

    form.send("input");

    expect(fake.states).toEqual([true]);

    expect(hasUnsavedChanges()).toBe(true);

    cash.value = "100";

    form.send("input");

    expect(fake.states).toEqual([true, false]);

    expect(hasUnsavedChanges()).toBe(false);

    cash.value = "300";

    form.send("input");

    cleanup();

    expect(hasUnsavedChanges()).toBe(false);
  });

  it("does nothing after a save when no save worked", () => {
    for (const savedAt of [null, undefined]) {
      fake.refs = [];

      fake.calls = 0;

      fake.effects = [];

      const { saved } = setUp(makeForm([]), savedAt);

      withTimers((timers) => {
        expect(saved.run()).toBeUndefined();

        expect(timers).toHaveLength(0);
      });
    }
  });

  it("runs the save effect again for each new save", () => {
    const first = { status: "success" };

    const { saved } = setUp(makeForm([]), first);

    expect(saved.deps).toHaveLength(1);

    expect(saved.deps[0]).toBe(first);
  });

  it("takes the shown values as saved after a save that worked, and clears the guard", () => {
    const cash = textBox("cash", "100");

    const form = makeForm([cash]);

    const { watch, saved } = setUp(form, { status: "success" });

    watch.run();

    cash.value = "250";

    form.send("input");

    expect(hasUnsavedChanges()).toBe(true);

    withTimers((timers) => {
      const cleanup = saved.run() as () => void;

      expect(timers).toHaveLength(2);

      expect(timers.map((timer) => timer.wait)).toEqual([0, 500]);

      timers[0].run();

      expect(hasUnsavedChanges()).toBe(false);

      expect(fake.states).toEqual([true, false]);

      cleanup();

      expect(timers.map((timer) => timer.cleared)).toEqual([true, true]);
    });
  });

  it("takes the values again a little later, when the new values from the server come late", () => {
    const cash = textBox("cash", "100");

    const form = makeForm([cash]);

    const { watch, saved } = setUp(form, { status: "success" });

    watch.run();

    withTimers((timers) => {
      saved.run();

      timers[0].run();

      cash.value = "250";

      timers[1].run();

      form.send("input");

      expect(hasUnsavedChanges()).toBe(false);

      cash.value = "251";

      form.send("input");

      expect(hasUnsavedChanges()).toBe(true);
    });

    expect(fake.states).toEqual([true]);
  });

  it("does not take the values again later when the person changed something meanwhile", () => {
    const cash = textBox("cash", "100");

    const form = makeForm([cash]);

    const { watch, saved } = setUp(form, { status: "success" });

    watch.run();

    withTimers((timers) => {
      saved.run();

      timers[0].run();

      cash.value = "300";

      form.send("input");

      timers[1].run();

      expect(hasUnsavedChanges()).toBe(true);

      cash.value = "100";

      form.send("input");

      expect(hasUnsavedChanges()).toBe(false);
    });

    expect(fake.states).toEqual([true, false]);
  });
});
