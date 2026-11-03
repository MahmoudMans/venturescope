import { describe, expect, it } from "vitest";

import { restoreFormSnapshot, takeFormSnapshot } from "@/lib/forms/form-snapshot";

type Fake = Record<string, unknown> & { value: string };

/** A small stand-in for a box of a form. The helper only reads these properties. */
function box(tagName: string, props: Record<string, unknown> = {}): Fake {
  return { tagName, type: "text", value: "", checked: false, isConnected: true, ...props } as Fake;
}

function formOf(...elements: Fake[]): HTMLFormElement {
  return { elements } as unknown as HTMLFormElement;
}

describe("takeFormSnapshot", () => {
  it("remembers text boxes, number boxes, text areas and menus", () => {
    const snapshot = takeFormSnapshot(
      formOf(
        box("INPUT", { value: "Acme" }),
        box("INPUT", { type: "number", value: "7" }),
        box("TEXTAREA", { value: "Notes" }),
        box("SELECT", { value: "USD", multiple: false, options: [] }),
      ),
    );

    expect(snapshot.map((entry) => entry.value)).toEqual(["Acme", "7", "Notes", "USD"]);
  });

  it("leaves out hidden boxes, passwords, files and buttons", () => {
    const snapshot = takeFormSnapshot(
      formOf(
        box("INPUT", { type: "hidden", value: "p1" }),
        box("INPUT", { type: "password", value: "secret" }),
        box("INPUT", { type: "file", value: "C:\\a.csv" }),
        box("INPUT", { type: "submit", value: "Save" }),
        box("INPUT", { type: "button", value: "More" }),
        box("INPUT", { type: "reset", value: "Reset" }),
        box("INPUT", { type: "image", value: "" }),
        box("BUTTON", { value: "go" }),
        box("FIELDSET", {}),
      ),
    );

    expect(snapshot).toEqual([]);
  });

  it("remembers which checkbox and radio buttons are on", () => {
    const snapshot = takeFormSnapshot(
      formOf(
        box("INPUT", { type: "checkbox", value: "on", checked: true }),
        box("INPUT", { type: "radio", value: "A", checked: false }),
        box("INPUT", { type: "radio", value: "B", checked: true }),
      ),
    );

    expect(snapshot.map((entry) => entry.checked)).toEqual([true, false, true]);
  });

  it("remembers which options of a menu with many choices are picked", () => {
    const snapshot = takeFormSnapshot(
      formOf(
        box("SELECT", {
          multiple: true,
          value: "a",
          options: [{ selected: true }, { selected: false }, { selected: true }],
        }),
      ),
    );

    expect(snapshot[0].selected).toEqual([true, false, true]);
  });

  it("does not change the form", () => {
    const text = box("INPUT", { value: "Acme" });

    takeFormSnapshot(formOf(text));

    expect(text.value).toBe("Acme");
  });
});

describe("restoreFormSnapshot", () => {
  it("puts back the text that was typed after the form was cleared", () => {
    const name = box("INPUT", { value: "Acme" });

    const note = box("TEXTAREA", { value: "A long note" });

    const snapshot = takeFormSnapshot(formOf(name, note));

    name.value = "Saved name";

    note.value = "";

    restoreFormSnapshot(snapshot);

    expect(name.value).toBe("Acme");

    expect(note.value).toBe("A long note");
  });

  it("puts back a menu choice", () => {
    const menu = box("SELECT", { value: "USD", multiple: false, options: [] });

    const snapshot = takeFormSnapshot(formOf(menu));

    menu.value = "EUR";

    restoreFormSnapshot(snapshot);

    expect(menu.value).toBe("USD");
  });

  it("puts back checkboxes and radio buttons without changing their value", () => {
    const check = box("INPUT", { type: "checkbox", value: "on", checked: true });

    const radio = box("INPUT", { type: "radio", value: "B", checked: false });

    const snapshot = takeFormSnapshot(formOf(check, radio));

    check.checked = false;

    radio.checked = true;

    restoreFormSnapshot(snapshot);

    expect(check.checked).toBe(true);

    expect(radio.checked).toBe(false);

    expect(check.value).toBe("on");

    expect(radio.value).toBe("B");
  });

  it("puts back the options of a menu with many choices", () => {
    const options = [{ selected: true }, { selected: false }];

    const menu = box("SELECT", { multiple: true, value: "a", options });

    const snapshot = takeFormSnapshot(formOf(menu));

    options[0].selected = false;

    options[1].selected = true;

    restoreFormSnapshot(snapshot);

    expect(options.map((option) => option.selected)).toEqual([true, false]);
  });

  it("does not fail when the menu has fewer options than before", () => {
    const options = [{ selected: true }, { selected: true }];

    const menu = box("SELECT", { multiple: true, value: "a", options });

    const snapshot = takeFormSnapshot(formOf(menu));

    menu.options = [{ selected: false }];

    expect(() => restoreFormSnapshot(snapshot)).not.toThrow();

    expect((menu.options as { selected: boolean }[])[0].selected).toBe(true);
  });

  it("never fills in a password again", () => {
    const password = box("INPUT", { type: "password", value: "secret" });

    const snapshot = takeFormSnapshot(formOf(password));

    password.value = "";

    restoreFormSnapshot(snapshot);

    expect(password.value).toBe("");
  });

  it("skips a box that is no longer on the page", () => {
    const gone = box("INPUT", { value: "Acme" });

    const snapshot = takeFormSnapshot(formOf(gone));

    gone.value = "";

    gone.isConnected = false;

    restoreFormSnapshot(snapshot);

    expect(gone.value).toBe("");
  });

  it("does nothing for an empty snapshot", () => {
    expect(() => restoreFormSnapshot([])).not.toThrow();
  });
});
