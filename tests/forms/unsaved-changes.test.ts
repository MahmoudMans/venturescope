import { describe, expect, it, vi } from "vitest";

import type { FieldSnapshot } from "@/lib/forms/form-snapshot";
import {
  hiddenSignature,
  isSaveShortcut,
  snapshotSignature,
  trackUnsavedChanges,
} from "@/lib/forms/unsaved-changes";

type Box = {
  tagName: string;
  type: string;
  name: string;
  value: string;
  checked: boolean;
  isConnected: boolean;
  defaultValue?: string;
  options?: { selected: boolean }[];
};

function textBox(name: string, value: string): Box {
  return { tagName: "INPUT", type: "text", name, value, checked: false, isConnected: true };
}

function numberBox(name: string, value: string): Box {
  return { ...textBox(name, value), type: "number", defaultValue: value };
}

function checkBox(name: string, checked: boolean): Box {
  return { tagName: "INPUT", type: "checkbox", name, value: "on", checked, isConnected: true };
}

function selectBox(name: string, selected: boolean[]): Box {
  return {
    tagName: "SELECT",
    type: "select-one",
    name,
    value: "",
    checked: false,
    isConnected: true,
    options: selected.map((flag) => ({ selected: flag })),
  };
}

type Listener = (event?: unknown) => void;

/** A small stand-in for a form. It keeps its listeners and can send an event to them. */
function makeForm(elements: Box[]) {
  const listeners: Record<string, Listener[]> = {};

  return {
    elements,
    listeners,
    requestSubmit: vi.fn(),
    pending: { running: false },
    querySelector(selector: string) {
      return selector === '[type="submit"]:disabled' && this.pending.running ? {} : null;
    },
    contains: (element: unknown) => (elements as unknown[]).includes(element),
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

type FakeForm = ReturnType<typeof makeForm>;

function track(form: FakeForm, extra: Record<string, unknown> = {}) {
  const changes: boolean[] = [];

  const later = vi.fn((run: () => void) => run());

  const tracker = trackUnsavedChanges(form as unknown as HTMLFormElement, {
    onChange: (dirty) => changes.push(dirty),
    later,
    watchBoxes: () => () => undefined,
    ...extra,
  });

  return { tracker, changes, later };
}

function key(
  name: string,
  flags: Partial<Record<"ctrlKey" | "metaKey" | "altKey" | "shiftKey", boolean>>,
) {
  return {
    key: name,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
    ...flags,
  };
}

function entry(name: string, value: string, checked = false, selected: boolean[] = []) {
  return {
    element: { name } as unknown as FieldSnapshot["element"],
    value,
    checked,
    selected,
  } satisfies FieldSnapshot;
}

describe("snapshotSignature", () => {
  it("is empty for a form without boxes", () => {
    expect(snapshotSignature([])).toBe("");
  });

  it("is the same text for the same boxes and values", () => {
    const first = snapshotSignature([entry("cash", "100"), entry("tax", "20")]);

    const second = snapshotSignature([entry("cash", "100"), entry("tax", "20")]);

    expect(first).toBe(second);
  });

  it("changes when a value, a name, a choice or a selected option changes", () => {
    const base = snapshotSignature([entry("cash", "100", false, [true, false])]);

    const changed = [
      entry("cash", "101", false, [true, false]),
      entry("money", "100", false, [true, false]),
      entry("cash", "100", true, [true, false]),
      entry("cash", "100", false, [false, true]),
    ].map((one) => snapshotSignature([one]));

    for (const text of changed) {
      expect(text).not.toBe(base);
    }

    expect(new Set(changed).size).toBe(changed.length);
  });

  it("changes when a box is added, removed or moved", () => {
    const one = entry("a", "1");

    const two = entry("b", "2");

    const both = snapshotSignature([one, two]);

    expect(snapshotSignature([one])).not.toBe(both);

    expect(snapshotSignature([two, one])).not.toBe(both);
  });

  it("does not mix up two boxes with a joined text", () => {
    expect(snapshotSignature([entry("a", "1"), entry("b", "")])).not.toBe(
      snapshotSignature([entry("a", "1\u0002b"), entry("", "")]),
    );
  });

  it("does not mix up the name and the value of a box", () => {
    expect(snapshotSignature([entry("ab", "c")])).not.toBe(snapshotSignature([entry("a", "bc")]));
  });

  it("does not take two boxes for one box that has a value with the same signs", () => {
    expect(snapshotSignature([entry("a", "v"), entry("n", "w")])).not.toBe(
      snapshotSignature([entry("a", "v\u00010\u0001n\u0001w")]),
    );
  });
});

describe("hiddenSignature", () => {
  const asForm = (elements: Box[]) => ({ elements }) as unknown as HTMLFormElement;

  it("is empty for a form without hidden boxes", () => {
    expect(hiddenSignature(asForm([]))).toBe("");

    expect(hiddenSignature(asForm([textBox("cash", "100"), checkBox("agree", true)]))).toBe("");
  });

  it("lists the name and the value of each hidden box, and nothing else", () => {
    const text = hiddenSignature(
      asForm([
        { ...textBox("projectId", "p1"), type: "hidden" },
        textBox("cash", "100"),
        { ...textBox("cogsMethod", "PERCENTAGE"), type: "hidden" },
      ]),
    );

    expect(text).toBe("projectId\u0001p1\u0002cogsMethod\u0001PERCENTAGE");
  });

  it("changes when a value changes, and is the same when it does not", () => {
    const method: Box = { ...textBox("cogsMethod", "PERCENTAGE"), type: "hidden" };

    const before = hiddenSignature(asForm([method]));

    expect(hiddenSignature(asForm([method]))).toBe(before);

    method.value = "FIXED_MONTHLY";

    expect(hiddenSignature(asForm([method]))).not.toBe(before);
  });

  it("does not take a select box or a text area for a hidden box", () => {
    expect(
      hiddenSignature(
        asForm([
          selectBox("currency", [true, false]),
          { ...textBox("notes", "x"), tagName: "TEXTAREA", type: "textarea" },
        ]),
      ),
    ).toBe("");
  });
});

describe("isSaveShortcut", () => {
  it("accepts Ctrl+S and Cmd+S in lower and upper case", () => {
    expect(isSaveShortcut(key("s", { ctrlKey: true }))).toBe(true);

    expect(isSaveShortcut(key("S", { ctrlKey: true }))).toBe(true);

    expect(isSaveShortcut(key("s", { metaKey: true }))).toBe(true);
  });

  it("does not accept S alone, other letters, or S with Shift or Alt", () => {
    expect(isSaveShortcut(key("s", {}))).toBe(false);

    expect(isSaveShortcut(key("a", { ctrlKey: true }))).toBe(false);

    expect(isSaveShortcut(key("s", { ctrlKey: true, shiftKey: true }))).toBe(false);

    expect(isSaveShortcut(key("s", { metaKey: true, altKey: true }))).toBe(false);
  });
});

describe("trackUnsavedChanges", () => {
  it("starts clean and says nothing", () => {
    const form = makeForm([textBox("cash", "100")]);

    const { tracker, changes } = track(form);

    expect(tracker.isDirty()).toBe(false);

    expect(changes).toEqual([]);
  });

  it("becomes dirty when a box changes and clean when the old value is typed back", () => {
    const cash = textBox("cash", "100");

    const form = makeForm([cash]);

    const { tracker, changes } = track(form);

    cash.value = "250";

    form.send("input");

    expect(tracker.isDirty()).toBe(true);

    cash.value = "100";

    form.send("input");

    expect(tracker.isDirty()).toBe(false);

    expect(changes).toEqual([true, false]);
  });

  it("says it only once while the form stays dirty", () => {
    const cash = textBox("cash", "100");

    const form = makeForm([cash]);

    const { changes } = track(form);

    for (const value of ["1", "12", "123"]) {
      cash.value = value;

      form.send("input");
    }

    expect(changes).toEqual([true]);
  });

  it("sees a changed choice, a changed option and a change event", () => {
    const agree = checkBox("agree", false);

    const mode = selectBox("mode", [true, false]);

    const form = makeForm([agree, mode]);

    const { tracker, changes } = track(form);

    agree.checked = true;

    form.send("change");

    expect(tracker.isDirty()).toBe(true);

    agree.checked = false;

    mode.options = [{ selected: false }, { selected: true }];

    form.send("change");

    expect(tracker.isDirty()).toBe(true);

    mode.options = [{ selected: true }, { selected: false }];

    form.send("change");

    expect(tracker.isDirty()).toBe(false);

    expect(changes).toEqual([true, false]);
  });

  it("ignores buttons, which a person does not type in", () => {
    const form = makeForm([
      { ...textBox("go", "Save"), type: "submit" },
      { ...textBox("more", "Add"), type: "button" },
    ]);

    const { tracker } = track(form);

    form.elements[0].value = "Saving";

    form.elements[1].value = "Adding";

    form.send("input");

    expect(tracker.isDirty()).toBe(false);
  });

  it("sees a hidden box that a button changes, and a clean form when it changes back", () => {
    const method: Box = { ...textBox("cogsMethod", "PERCENTAGE"), type: "hidden" };

    const form = makeForm([method]);

    const { tracker, changes } = track(form);

    method.value = "FIXED_MONTHLY";

    form.send("click");

    expect(tracker.isDirty()).toBe(true);

    method.value = "PERCENTAGE";

    form.send("click");

    expect(tracker.isDirty()).toBe(false);

    expect(changes).toEqual([true, false]);
  });

  it("sees a hidden box that is added or removed", () => {
    const form = makeForm([textBox("cash", "100")]);

    const { tracker } = track(form);

    form.elements.push({ ...textBox("cogsFixedMonthly", "0"), type: "hidden" });

    form.send("click");

    expect(tracker.isDirty()).toBe(true);
  });

  it("takes a changed hidden box as saved after markSaved", () => {
    const method: Box = { ...textBox("cogsMethod", "PERCENTAGE"), type: "hidden" };

    const form = makeForm([method]);

    const { tracker } = track(form);

    method.value = "FIXED_MONTHLY";

    form.send("click");

    tracker.markSaved();

    expect(tracker.isDirty()).toBe(false);

    form.send("click");

    expect(tracker.isDirty()).toBe(false);
  });

  it("takes the shown values as saved after markSaved", () => {
    const cash = textBox("cash", "100");

    const form = makeForm([cash]);

    const { tracker, changes } = track(form);

    cash.value = "250";

    form.send("input");

    tracker.markSaved();

    expect(tracker.isDirty()).toBe(false);

    expect(changes).toEqual([true, false]);

    cash.value = "100";

    form.send("input");

    expect(tracker.isDirty()).toBe(true);
  });

  it("says nothing when markSaved is called on a clean form", () => {
    const form = makeForm([textBox("cash", "100")]);

    const { tracker, changes } = track(form);

    tracker.markSaved();

    expect(changes).toEqual([]);
  });

  it("checks again one tick after a click, because a click can remove a row", () => {
    const rows = [textBox("expense-1", "10"), textBox("expense-2", "20")];

    const form = makeForm([...rows]);

    const waiting: (() => void)[] = [];

    const later = vi.fn((run: () => void) => waiting.push(run));

    const { tracker, changes } = track(form, { later });

    expect(later).not.toHaveBeenCalled();

    form.send("click");

    expect(later).toHaveBeenCalledTimes(1);

    expect(waiting).toHaveLength(1);

    expect(tracker.isDirty()).toBe(false);

    form.elements.pop();

    waiting.forEach((run) => run());

    expect(tracker.isDirty()).toBe(true);

    expect(changes).toEqual([true]);
  });

  it("checks again when boxes are added or removed without a click", () => {
    const form = makeForm([textBox("expense-1", "10")]);

    let notify: () => void = () => undefined;

    const stopWatching = vi.fn();

    const { tracker, changes } = track(form, {
      watchBoxes: (_form: unknown, run: () => void) => {
        notify = run;

        return stopWatching;
      },
    });

    form.elements.push(textBox("expense-2", "0"));

    notify();

    expect(tracker.isDirty()).toBe(true);

    expect(changes).toEqual([true]);

    tracker.stop();

    expect(stopWatching).toHaveBeenCalledTimes(1);
  });

  it("turns Ctrl+S in the form into a save", () => {
    const form = makeForm([textBox("cash", "100")]);

    track(form);

    const event = key("s", { ctrlKey: true });

    form.send("keydown", event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);

    expect(form.requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not send the form again while a save runs, but still stops the page save of the browser", () => {
    const form = makeForm([textBox("cash", "100")]);

    track(form);

    form.pending.running = true;

    const event = key("s", { ctrlKey: true });

    form.send("keydown", event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);

    expect(form.requestSubmit).not.toHaveBeenCalled();

    form.pending.running = false;

    form.send("keydown", key("s", { metaKey: true }));

    expect(form.requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("leaves other keys alone", () => {
    const form = makeForm([textBox("cash", "100")]);

    track(form);

    const event = key("s", {});

    form.send("keydown", event);

    expect(event.preventDefault).not.toHaveBeenCalled();

    expect(form.requestSubmit).not.toHaveBeenCalled();
  });

  it("stops listening when it is stopped", () => {
    const form = makeForm([textBox("cash", "100")]);

    const { tracker } = track(form);

    expect(Object.keys(form.listeners).sort()).toEqual([
      "change",
      "click",
      "input",
      "keydown",
      "submit",
    ]);

    tracker.stop();

    for (const type of Object.keys(form.listeners)) {
      expect(form.listeners[type], type).toEqual([]);
    }
  });
});

describe("a number box that has the cursor when the form is sent", () => {
  /**
   * Types a new number, sends the form, and then does what React does when the save ends: the old
   * number is back in the box, because React does not show the new one in a box with the cursor.
   */
  function sendWithCursor(box: Box, sent: string, cursor: Box | null = box) {
    const form = makeForm([box]);

    const where = { current: cursor };

    const { tracker, changes } = track(form, { activeElement: () => where.current });

    box.value = sent;

    form.send("input");

    form.send("submit");

    box.value = box.defaultValue ?? "";

    return { form, tracker, changes, where };
  }

  it("keeps the number that was sent, and the form is clean", () => {
    const box = numberBox("cash", "1000");

    const { tracker, changes } = sendWithCursor(box, "4200");

    tracker.markSaved();

    expect(box.value).toBe("4200");

    expect(box.defaultValue).toBe("4200");

    expect(tracker.isDirty()).toBe(false);

    expect(changes).toEqual([true, false]);
  });

  it("does nothing when the cursor has moved to another box before the end of the save", () => {
    const box = numberBox("cash", "1000");

    const { tracker, where } = sendWithCursor(box, "4200");

    where.current = null;

    tracker.markSaved();

    expect(box.value).toBe("1000");

    expect(box.defaultValue).toBe("1000");
  });

  it("does nothing when the person typed something else after the save ended", () => {
    const box = numberBox("cash", "1000");

    const { tracker } = sendWithCursor(box, "4200");

    box.value = "1005";

    tracker.markSaved();

    expect(box.value).toBe("1005");

    expect(box.defaultValue).toBe("1000");
  });

  it("does nothing when the form was not sent", () => {
    const box = numberBox("cash", "1000");

    const form = makeForm([box]);

    const { tracker } = track(form, { activeElement: () => box });

    box.value = "4200";

    form.send("input");

    box.value = "1000";

    tracker.markSaved();

    expect(box.value).toBe("1000");
  });

  it("does nothing when the box did not change", () => {
    const box = numberBox("cash", "1000");

    const { tracker } = sendWithCursor(box, "1000");

    tracker.markSaved();

    expect(box.value).toBe("1000");

    expect(box.defaultValue).toBe("1000");
  });

  it("leaves a text box alone, because React shows the new text in it", () => {
    const box: Box = { ...textBox("name", "Acme"), defaultValue: "Acme" };

    const { tracker } = sendWithCursor(box, "Acme Two");

    tracker.markSaved();

    expect(box.value).toBe("Acme");

    expect(box.defaultValue).toBe("Acme");
  });

  it("leaves a box that is not in the form alone", () => {
    const outside = numberBox("search", "1000");

    const form = makeForm([numberBox("cash", "1000")]);

    const { tracker } = track(form, { activeElement: () => outside });

    outside.value = "4200";

    form.send("submit");

    outside.value = "1000";

    tracker.markSaved();

    expect(outside.value).toBe("1000");
  });

  it("leaves a box that is no longer on the page alone", () => {
    const box = numberBox("cash", "1000");

    const { tracker } = sendWithCursor(box, "4200");

    box.isConnected = false;

    tracker.markSaved();

    expect(box.value).toBe("1000");
  });

  it("does it only for one save", () => {
    const box = numberBox("cash", "1000");

    const { tracker } = sendWithCursor(box, "4200");

    tracker.markSaved();

    box.value = "1000";

    box.defaultValue = "1000";

    tracker.markSaved();

    expect(box.value).toBe("1000");
  });

  it("does not need the box after the tracker has stopped", () => {
    const box = numberBox("cash", "1000");

    const { tracker, form } = sendWithCursor(box, "4200");

    tracker.stop();

    expect(form.listeners.submit).toEqual([]);
  });
});

describe("the way a tracker watches when nothing is given to it", () => {
  type Observed = { target: unknown; options: unknown };

  const made: { callback: () => void; observed: Observed[]; disconnected: boolean }[] = [];

  class FakeObserver {
    callback: () => void;

    observed: Observed[] = [];

    disconnected = false;

    constructor(callback: () => void) {
      this.callback = callback;

      made.push(this);
    }

    observe(target: unknown, options: unknown) {
      this.observed.push({ target, options });
    }

    disconnect() {
      this.disconnected = true;
    }
  }

  const scope = globalThis as unknown as Record<string, unknown>;

  function withObserver(test: () => void) {
    const before = scope.MutationObserver;

    made.length = 0;

    scope.MutationObserver = FakeObserver;

    try {
      test();
    } finally {
      scope.MutationObserver = before;
    }
  }

  it("watches the form for boxes that are added or removed, with all the boxes inside", () => {
    withObserver(() => {
      const box = textBox("expense-1", "10");

      const form = makeForm([box]);

      const changes: boolean[] = [];

      const tracker = trackUnsavedChanges(form as unknown as HTMLFormElement, {
        onChange: (dirty) => changes.push(dirty),
      });

      expect(made).toHaveLength(1);

      expect(made[0].observed).toEqual([
        { target: form, options: { childList: true, subtree: true } },
      ]);

      form.elements.push(textBox("expense-2", "0"));

      made[0].callback();

      expect(changes).toEqual([true]);

      tracker.stop();

      expect(made[0].disconnected).toBe(true);
    });
  });

  it("does not fail when the browser has no MutationObserver", () => {
    const before = scope.MutationObserver;

    scope.MutationObserver = undefined;

    try {
      const form = makeForm([textBox("cash", "100")]);

      const tracker = trackUnsavedChanges(form as unknown as HTMLFormElement, {
        onChange: () => undefined,
      });

      expect(() => tracker.stop()).not.toThrow();
    } finally {
      scope.MutationObserver = before;
    }
  });

  it("checks one tick after a click, with a timer of 0 milliseconds", () => {
    const timers: { run: () => void; wait: unknown }[] = [];

    const realSet = globalThis.setTimeout;

    globalThis.setTimeout = ((run: () => void, wait: unknown) => {
      timers.push({ run, wait });

      return timers.length;
    }) as unknown as typeof setTimeout;

    try {
      const box = textBox("cash", "100");

      const form = makeForm([box]);

      const changes: boolean[] = [];

      trackUnsavedChanges(form as unknown as HTMLFormElement, {
        onChange: (dirty) => changes.push(dirty),
        watchBoxes: () => () => undefined,
      });

      box.value = "250";

      form.send("click");

      expect(timers).toHaveLength(1);

      expect(timers[0].wait).toBe(0);

      expect(changes).toEqual([]);

      timers[0].run();

      expect(changes).toEqual([true]);
    } finally {
      globalThis.setTimeout = realSet;
    }
  });
});
