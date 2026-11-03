import { beforeEach, describe, expect, it, vi } from "vitest";

// The hook is called outside a component here, so the test gives it a name without "use".
import { useFormErrorRecovery as callRecoveryHook } from "@/components/forms/use-form-error-recovery";

const fake = vi.hoisted(() => ({
  refs: [] as { current: unknown }[],
  calls: 0,
  effects: [] as { run: () => unknown; deps: unknown[] }[],
}));

vi.mock("react", () => ({
  useRef: (initial: unknown) => {
    const ref = fake.refs[fake.calls] ?? { current: initial };

    fake.refs[fake.calls] = ref;

    fake.calls += 1;

    return ref;
  },
  useEffect: (run: () => unknown, deps: unknown[]) => {
    fake.effects.push({ run, deps });
  },
}));

type Box = { tagName: string; type: string; value: string; checked: boolean; isConnected: boolean };

function textBox(value: string, type = "text"): Box {
  return { tagName: "INPUT", type, value, checked: false, isConnected: true };
}

/** A small stand-in for a form that can send a submit event to the listeners. */
function makeForm(elements: Box[], invalid: { focus: () => void } | null = null) {
  const listeners: (() => void)[] = [];

  const removed: (() => void)[] = [];

  return {
    elements,
    listeners,
    removed,
    selectors: [] as string[],
    addEventListener: (type: string, listener: () => void) => {
      if (type === "submit") {
        listeners.push(listener);
      }
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === "submit") {
        removed.push(listener);
      }
    },
    querySelector(selector: string) {
      this.selectors.push(selector);

      return invalid;
    },
    submit() {
      listeners.forEach((listener) => listener());
    },
  };
}

function setUp(form: unknown, errors: Record<string, string[] | undefined> | undefined) {
  fake.refs[0] = { current: form };

  const ref = callRecoveryHook(errors);

  return { ref, remember: fake.effects[0], recover: fake.effects[1] };
}

beforeEach(() => {
  fake.refs = [];

  fake.calls = 0;

  fake.effects = [];
});

describe("useFormErrorRecovery", () => {
  it("gives back the ref that goes on the form", () => {
    const form = makeForm([]);

    expect(setUp(form, undefined).ref).toBe(fake.refs[0]);
  });

  it("listens for the submit of the form once and stops when the page closes", () => {
    const form = makeForm([]);

    const { remember } = setUp(form, undefined);

    expect(remember.deps).toEqual([]);

    const cleanup = remember.run() as () => void;

    expect(form.listeners).toHaveLength(1);

    cleanup();

    expect(form.removed).toEqual(form.listeners);
  });

  it("does not fail when the form is not there yet", () => {
    const { remember, recover } = setUp(null, { name: ["Too short"] });

    expect(remember.run()).toBeUndefined();

    expect(() => recover.run()).not.toThrow();
  });

  it("runs again when the server sends a new set of messages", () => {
    const errors = { name: ["Too short"] };

    const { recover } = setUp(makeForm([]), errors);

    expect(recover.deps).toHaveLength(1);

    expect(recover.deps[0]).toBe(errors);
  });

  it("puts back what the person typed and moves the cursor to the first wrong box", () => {
    const cash = textBox("7", "number");

    const invalid = { focus: vi.fn() };

    const form = makeForm([cash], invalid);

    const { remember, recover } = setUp(form, { startingCash: ["Must be 0 or more"] });

    remember.run();

    form.submit();

    cash.value = "1000";

    recover.run();

    expect(cash.value).toBe("7");

    expect(form.selectors).toEqual(['[aria-invalid="true"]']);

    expect(invalid.focus).toHaveBeenCalledTimes(1);
  });

  it("keeps the last submit, so a second failed save puts back the newest text", () => {
    const cash = textBox("7", "number");

    const form = makeForm([cash], { focus: vi.fn() });

    const { remember, recover } = setUp(form, { startingCash: ["Must be 0 or more"] });

    remember.run();

    form.submit();

    cash.value = "1000";

    recover.run();

    cash.value = "9";

    form.submit();

    cash.value = "1000";

    recover.run();

    expect(cash.value).toBe("9");
  });

  it("changes nothing when the save has no field messages", () => {
    const cash = textBox("7", "number");

    const invalid = { focus: vi.fn() };

    const form = makeForm([cash], invalid);

    for (const errors of [undefined, {}, { name: [], email: undefined }]) {
      fake.refs = [];

      fake.calls = 0;

      fake.effects = [];

      const { remember, recover } = setUp(form, errors);

      remember.run();

      form.submit();

      cash.value = "1000";

      recover.run();

      expect(cash.value).toBe("1000");
    }

    expect(form.selectors).toEqual([]);

    expect(invalid.focus).not.toHaveBeenCalled();
  });

  it("does not put a password back", () => {
    const password = textBox("secret", "password");

    const form = makeForm([password], { focus: vi.fn() });

    const { remember, recover } = setUp(form, { password: ["Wrong"] });

    remember.run();

    form.submit();

    password.value = "";

    recover.run();

    expect(password.value).toBe("");
  });

  it("does not fail when no box is marked wrong", () => {
    const form = makeForm([textBox("a")], null);

    const { recover } = setUp(form, { name: ["Too short"] });

    expect(() => recover.run()).not.toThrow();

    expect(form.selectors).toHaveLength(1);
  });
});
