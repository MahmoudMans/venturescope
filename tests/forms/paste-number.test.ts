import { describe, expect, it, vi } from "vitest";

import {
  installNumberPaste,
  type PasteEnvironment,
  parsePastedNumber,
} from "@/lib/forms/paste-number";

describe("parsePastedNumber: numbers that are read", () => {
  const cases: [string, string][] = [
    ["1,250,000", "1250000"],
    ["1,250,000.50", "1250000.50"],
    ["123,456", "123456"],
    ["1,250", "1250"],
    ["$1,250,000", "1250000"],
    ["$ -1,200", "-1200"],
    ["-$1,200", "-1200"],
    ["1 250 000", "1250000"],
    ["1\u00a0250,50", "1250.50"],
    ["1\u202f250,50", "1250.50"],
    ["1\u2009250,50", "1250.50"],
    ["1 250.50", "1250.50"],
    ["1 234 567 890,123", "1234567890.123"],
    ["1.250.000,50", "1250000.50"],
    ["1.250.000", "1250000"],
    ["1.250,5", "1250.5"],
    ["1250,50", "1250.50"],
    ["1250,500", "1250.500"],
    ["123,45", "123.45"],
    ["1,25", "1.25"],
    ["0,5", "0.5"],
    ["0,500", "0.500"],
    ["12.5%", "12.5"],
    ["12,5 %", "12.5"],
    ["1 250,500 DT", "1250.500"],
    ["TND 1 250", "1250"],
    ["1 250 USD", "1250"],
    ["\u20ac1.234,56", "1234.56"],
    ["\u00a31,250", "1250"],
    ["\u00a51,250", "1250"],
    ["EUR 1.234,56", "1234.56"],
    [" 1,250 \r\n", "1250"],
  ];

  it("reads each format of Excel and Google Sheets as a plain number", () => {
    for (const [text, expected] of cases) {
      expect(parsePastedNumber(text), JSON.stringify(text)).toBe(expected);
    }
  });
});

describe("parsePastedNumber: minus numbers", () => {
  const cases: [string, string][] = [
    ["(1,200)", "-1200"],
    ["(1,200.50)", "-1200.50"],
    ["(5)", "-5"],
    ["(TND 1 200)", "-1200"],
    ["-1,200", "-1200"],
    ["\u22121,200", "-1200"],
    ["\u20131,200", "-1200"],
    ["1,200-", "-1200"],
    ["- 5", "-5"],
    ["+1,200", "1200"],
  ];

  it("reads each way to write a minus number", () => {
    for (const [text, expected] of cases) {
      expect(parsePastedNumber(text), JSON.stringify(text)).toBe(expected);
    }
  });

  it("does not lose the minus sign of a number in brackets", () => {
    expect(parsePastedNumber("(1,200)")?.startsWith("-")).toBe(true);
  });
});

describe("parsePastedNumber: texts that are left to the browser", () => {
  const cases = [
    "",
    "   ",
    "abc",
    "NaN",
    "1250",
    "12.5",
    "-5",
    ".5",
    "1.250",
    "1.5",
    "1,2,3",
    "12,345,67",
    "1,250,00",
    "1.2.3",
    "10 00",
    "12 345 6",
    "1e5",
    "--5",
    "5-5",
    "1250\t300",
    "1250\n1300",
    "TND\n1250",
    "12\n%",
    "(5\n)",
  ];

  it("gives null, so the browser does what it always did", () => {
    for (const text of cases) {
      expect(parsePastedNumber(text), JSON.stringify(text)).toBeNull();
    }
  });

  it("keeps a long number exactly, because it never becomes a JavaScript number", () => {
    expect(parsePastedNumber("12,345,678,901,234,567,890.123456789")).toBe(
      "12345678901234567890.123456789",
    );
  });
});

type Listener = (event: unknown) => void;

type Registered = { type: string; listener: Listener; capture: boolean | undefined };

function setUp() {
  const registered: Registered[] = [];

  const doc = {
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
  };

  const setValue = vi.fn();

  const environment = { doc, setValue } as unknown as PasteEnvironment;

  const release = installNumberPaste(environment);

  /** Sends a paste to the handler, the way the page would. */
  const paste = (target: unknown, text: string | null, extra: Record<string, unknown> = {}) => {
    const event = {
      target,
      defaultPrevented: false,
      clipboardData: text === null ? null : { getData: () => text },
      preventDefault: vi.fn(),
      ...extra,
    };

    registered.filter((entry) => entry.type === "paste").forEach((entry) => entry.listener(event));

    return event;
  };

  return { registered, setValue, release, paste };
}

const numberBox = { tagName: "INPUT", type: "number", readOnly: false, disabled: false };

describe("installNumberPaste", () => {
  it("listens once for pastes, before React (capture), and stops when it is told to", () => {
    const { registered, release } = setUp();

    expect(registered).toHaveLength(1);

    expect(registered[0].type).toBe("paste");

    expect(registered[0].capture).toBe(true);

    release();

    expect(registered).toHaveLength(0);
  });

  it("puts the right number in a number box and stops the paste of the browser", () => {
    const { paste, setValue } = setUp();

    const event = paste(numberBox, "1 250,50");

    expect(event.preventDefault).toHaveBeenCalledTimes(1);

    expect(setValue).toHaveBeenCalledWith(numberBox, "1250.50");
  });

  it("keeps the minus sign of a number in brackets", () => {
    const { paste, setValue } = setUp();

    paste(numberBox, "(1,200)");

    expect(setValue).toHaveBeenCalledWith(numberBox, "-1200");
  });

  it("leaves a plain number to the browser, so a paste in the middle of a number works as before", () => {
    const { paste, setValue } = setUp();

    const event = paste(numberBox, "1250");

    expect(event.preventDefault).not.toHaveBeenCalled();

    expect(setValue).not.toHaveBeenCalled();
  });

  it("leaves a text that is not a number to the browser", () => {
    const { paste, setValue } = setUp();

    const event = paste(numberBox, "hello");

    expect(event.preventDefault).not.toHaveBeenCalled();

    expect(setValue).not.toHaveBeenCalled();
  });

  it("does nothing in a text box, a text area or something that is not a box", () => {
    const { paste, setValue } = setUp();

    for (const target of [
      { tagName: "INPUT", type: "text" },
      { tagName: "TEXTAREA", type: "textarea" },
      { tagName: "DIV" },
      null,
      "text",
    ]) {
      const event = paste(target, "1 250,50");

      expect(event.preventDefault).not.toHaveBeenCalled();
    }

    expect(setValue).not.toHaveBeenCalled();
  });

  it("does nothing in a number box that is read only or off", () => {
    const { paste, setValue } = setUp();

    paste({ ...numberBox, readOnly: true }, "1 250,50");

    paste({ ...numberBox, disabled: true }, "1 250,50");

    expect(setValue).not.toHaveBeenCalled();
  });

  it("does nothing when the paste has no text or another handler already took it", () => {
    const { paste, setValue } = setUp();

    paste(numberBox, null);

    paste(numberBox, "1 250,50", { defaultPrevented: true });

    expect(setValue).not.toHaveBeenCalled();
  });

  it("does nothing outside a browser", () => {
    expect(() => installNumberPaste(null)()).not.toThrow();
  });
});
