import { describe, expect, it, vi } from "vitest";

import { decidePaste, installNumberPaste, type PasteEnvironment } from "@/lib/forms/paste-number";

describe("decidePaste: one cell", () => {
  it("sets a number that needs to be fixed", () => {
    expect(decidePaste("1 250,50")).toEqual({ action: "set", value: "1250.50" });

    expect(decidePaste("(1,200)")).toEqual({ action: "set", value: "-1200" });
  });

  it("ignores the line break that a spreadsheet adds after one cell", () => {
    expect(decidePaste("1 250,50\r\n")).toEqual({ action: "set", value: "1250.50" });

    expect(decidePaste("1250\r\n")).toEqual({ action: "leave" });
  });

  it("leaves a plain number, an empty paste and a text to the browser", () => {
    for (const text of ["1250", "-5", "12.5", "", "   ", "\r\n", "hello", "hello 1250"]) {
      expect(decidePaste(text), JSON.stringify(text)).toEqual({ action: "leave" });
    }
  });
});

describe("decidePaste: many cells", () => {
  const cases: [string, string][] = [
    ["100\t200", "100"],
    ["100\n200", "100"],
    ["100\r\n200\r\n", "100"],
    ["100\t200\t300", "100"],
    ["100\t\t200", "100"],
    ["\t100\t200", "100"],
    ["100 \t 200", "100"],
    ["100\t \t200", "100"],
    ["0\t5", "0"],
    ["0,5\t5", "0.5"],
    ["100\t200\r\n300\t400\r\n", "100"],
    ["1 250,50\t99", "1250.50"],
    ["(1,200)\t5", "-1200"],
    ["TND 1 250\t5", "1250"],
    ["+5\t6", "5"],
    ["-5\t6", "-5"],
    [".5\t6", ".5"],
    ["12.5\t6", "12.5"],
    ["1e5\t6", "1e5"],
  ];

  it("takes the first cell, read like a paste of one cell", () => {
    for (const [text, expected] of cases) {
      expect(decidePaste(text), JSON.stringify(text)).toEqual({ action: "set", value: expected });
    }
  });

  it("does not glue the digits of the cells together", () => {
    for (const text of ["100\t200", "100\n200", "1 250,50\t99", "12\t34\t56"]) {
      const decision = decidePaste(text);

      expect(decision.action, JSON.stringify(text)).toBe("set");

      if (decision.action === "set") {
        expect(decision.value.length, JSON.stringify(text)).toBeLessThan(
          text.replace(/\D/g, "").length,
        );
      }
    }
  });

  it("keeps a long first cell exactly", () => {
    expect(decidePaste("12,345,678,901,234,567,890.123456789\t5")).toEqual({
      action: "set",
      value: "12345678901234567890.123456789",
    });
  });

  it("stops the paste when the first cell is not a number", () => {
    for (const text of [
      "Revenue\t1250",
      "abc\t5",
      "Q1\t1250\t1300",
      "TND\n1250",
      "5.\t6",
      "1,2,3\t4",
      "(5\n)",
      "hello\nworld",
    ]) {
      expect(decidePaste(text), JSON.stringify(text)).toEqual({ action: "block" });
    }
  });
});

type Listener = (event: unknown) => void;

function setUp() {
  const listeners: Listener[] = [];

  const doc = {
    addEventListener(_type: string, listener: Listener) {
      listeners.push(listener);
    },
    removeEventListener() {},
  };

  const setValue = vi.fn();

  installNumberPaste({ doc, setValue } as unknown as PasteEnvironment);

  const paste = (target: unknown, text: string) => {
    const event = {
      target,
      defaultPrevented: false,
      clipboardData: { getData: () => text },
      preventDefault: vi.fn(),
    };

    listeners.forEach((listener) => listener(event));

    return event;
  };

  return { setValue, paste };
}

const numberBox = { tagName: "INPUT", type: "number", readOnly: false, disabled: false };

describe("the paste handler with many cells", () => {
  it("puts the first cell in the box and stops the paste of the browser", () => {
    const { paste, setValue } = setUp();

    const event = paste(numberBox, "100\t200");

    expect(event.preventDefault).toHaveBeenCalledTimes(1);

    expect(setValue).toHaveBeenCalledTimes(1);

    expect(setValue).toHaveBeenCalledWith(numberBox, "100");
  });

  it("stops the paste and puts nothing in the box when the first cell is a title", () => {
    const { paste, setValue } = setUp();

    const event = paste(numberBox, "Revenue\t1250");

    expect(event.preventDefault).toHaveBeenCalledTimes(1);

    expect(setValue).not.toHaveBeenCalled();
  });

  it("does nothing in a text box, in a box that is read only or in a box that is off", () => {
    const { paste, setValue } = setUp();

    for (const target of [
      { tagName: "INPUT", type: "text" },
      { tagName: "TEXTAREA", type: "textarea" },
      { ...numberBox, readOnly: true },
      { ...numberBox, disabled: true },
    ]) {
      const event = paste(target, "100\t200");

      expect(event.preventDefault).not.toHaveBeenCalled();
    }

    expect(setValue).not.toHaveBeenCalled();
  });

  it("still leaves a plain number to the browser", () => {
    const { paste, setValue } = setUp();

    const event = paste(numberBox, "1250");

    expect(event.preventDefault).not.toHaveBeenCalled();

    expect(setValue).not.toHaveBeenCalled();
  });
});
