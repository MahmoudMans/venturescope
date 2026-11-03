/**
 * Reads a number that a person pastes from a spreadsheet. A number box (input type="number") of
 * the browser does not read every format. Checked in Chromium: "1 250,50" became 125050 (100 times
 * too big), "(1,200)" lost its minus sign and became 1200. This file reads the formats of
 * Excel and Google Sheets and gives back a plain number text such as "-1200" or "1250.50".
 *
 * Numbers are kept as text from the start to the end. They are never turned into a JavaScript
 * number, so a long number does not lose digits.
 */

/** The marks for a minus: the hyphen, the true minus sign (U+2212) and the dashes. */
const MINUS = "[-\\u2212\\u2013\\u2012\\u2011]";

/** The spaces that spreadsheets put between groups of three digits. */
const GROUP_SPACE = "[ \\u00a0\\u202f\\u2009]";

const LEADING_MINUS = new RegExp(`^(${MINUS}|\\+)\\s*`);

const TRAILING_MINUS = new RegExp(`\\s*${MINUS}$`);

const GROUPED_BY_SPACE = new RegExp(`^\\d{1,3}(${GROUP_SPACE}\\d{3})+([.,]\\d+)?$`);

const SPACES = new RegExp(GROUP_SPACE, "g");

/**
 * The number text for a pasted text, or null when the text should be left to the browser: it is
 * already a plain number, or it is not a number that this file can read for sure.
 *
 * What is read (the sign can be a minus, a plus, brackets or a minus at the end):
 * - 1,250,000.50 (commas between groups of three, a dot for the decimals)
 * - 1 250 000,50 (spaces between groups of three, a comma or a dot for the decimals)
 * - 1.250.000,50 (dots between groups of three, a comma for the decimals)
 * - 1250,50 and 0,5 (a comma for the decimals)
 * - a currency sign ($ and others), a currency code (TND, USD, DT) and a percent sign
 *
 * A single comma and exactly three digits (1,250) is read as a group of thousands, because the
 * numbers that the app shows look like that. A single dot (1.250) is a decimal point.
 *
 * With decimalComma true (a file that is separated by semicolons) a comma is always the decimal
 * mark: 1,250 is 1.250, and 1,250,000 is not read.
 */
export function parsePastedNumber(raw: string, decimalComma = false): string | null {
  let text = raw.trim();

  if (text === "" || /[\r\n\t]/.test(text)) {
    return null;
  }

  let negative = false;

  const bracket = /^\((.*)\)$/.exec(text);

  if (bracket !== null) {
    negative = true;

    text = bracket[1].trim();
  }

  text = text.replace(/[$\u20ac\u00a3\u00a5]/g, "").trim();

  text = text.replace(/\s*%$/, "").trim();

  text = text
    .replace(/^[A-Za-z]{2,3}\s*/, "")
    .replace(/\s*[A-Za-z]{2,3}$/, "")
    .trim();

  const lead = LEADING_MINUS.exec(text);

  if (lead !== null) {
    negative = negative || lead[1] !== "+";

    text = text.slice(lead[0].length).trim();
  }

  if (TRAILING_MINUS.test(text)) {
    negative = true;

    text = text.replace(TRAILING_MINUS, "").trim();
  }

  let value: string | null = null;

  if (/^\d+$/.test(text) || /^\d*\.\d+$/.test(text)) {
    value = text;
  } else if (/^0,\d+$/.test(text)) {
    value = text.replace(",", ".");
  } else if (decimalComma === false && /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) {
    value = text.replace(/,/g, "");
  } else if (GROUPED_BY_SPACE.test(text)) {
    value = text.replace(SPACES, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+,\d+$/.test(text) || /^\d{1,3}(\.\d{3}){2,}$/.test(text)) {
    value = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+,\d+$/.test(text)) {
    value = text.replace(",", ".");
  }

  if (value === null) {
    return null;
  }

  const result = `${negative ? "-" : ""}${value}`;

  return result === raw.trim() ? null : result;
}

/** A number that the number box of the browser accepts as it is: -12, 12.5, .5 or 1e5. */
const PLAIN_NUMBER = /^-?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?$/;

/** What the handler does with a paste: the browser keeps it, a number is set, or it is stopped. */
export type PasteDecision =
  | { action: "leave" }
  | { action: "set"; value: string }
  | { action: "block" };

/**
 * Decides what a paste means for one number box.
 *
 * A row or a column that was copied from a spreadsheet has tabs or line breaks between the cells.
 * The browser glues the digits of all the cells together: two cells, 100 and 200, became 100200
 * (checked in Chromium). So a box takes the first cell, read like a paste of one cell, and the
 * other cells are dropped. When the first cell is not a number (a title, for example), nothing is
 * pasted, so no wrong number is made.
 */
export function decidePaste(raw: string): PasteDecision {
  const cells = raw
    .trim()
    .split(/[\t\r\n]+/)
    .map((cell) => cell.trim());

  if (cells.length < 2) {
    const fixed = parsePastedNumber(raw);

    return fixed === null ? { action: "leave" } : { action: "set", value: fixed };
  }

  const first = cells[0];

  const value = parsePastedNumber(first) ?? (PLAIN_NUMBER.test(first) ? first : null);

  return value === null ? { action: "block" } : { action: "set", value };
}

/** What the paste handler needs to know about the box that gets the paste. */
type PasteTarget = {
  tagName?: string;
  type?: string;
  readOnly?: boolean;
  disabled?: boolean;
};

/** True for a number box that a person can type in. */
function isEditableNumberBox(target: unknown): boolean {
  const box = target as PasteTarget | null;

  if (box === null || typeof box !== "object") {
    return false;
  }

  return (
    box.tagName === "INPUT" &&
    box.type === "number" &&
    box.readOnly !== true &&
    box.disabled !== true
  );
}

/** The part of the page that the paste handler uses. A real document fits. */
export type PasteEnvironment = {
  doc: Pick<Document, "addEventListener" | "removeEventListener">;
  setValue: (box: unknown, value: string) => void;
};

/**
 * Puts a new value in a box so that React and the other listeners see it as typing: the value is
 * set with the setter of the browser (React does not notice a plain box.value = ...) and an input
 * event is sent. The warning for unsaved changes also listens to this event.
 */
function setBrowserValue(box: unknown, value: string): void {
  const input = box as HTMLInputElement;

  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

  if (setter === undefined) {
    input.value = value;
  } else {
    setter.call(input, value);
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function browserEnvironment(): PasteEnvironment | null {
  if (typeof document === "undefined") {
    return null;
  }

  return { doc: document, setValue: setBrowserValue };
}

/**
 * Makes a paste of a formatted number work in every number box of the page. It listens once for
 * the whole page, before React. A paste of text that is already a plain number, a paste in another
 * kind of box and a paste of text that is not a number are left to the browser. A paste of many
 * cells fills the box with the first cell only (see decidePaste). Returns a function that stops the
 * handler.
 */
export function installNumberPaste(
  environment: PasteEnvironment | null = browserEnvironment(),
): () => void {
  if (environment === null) {
    return () => undefined;
  }

  const { doc, setValue } = environment;

  const onPaste = (event: ClipboardEvent) => {
    if (event.defaultPrevented || isEditableNumberBox(event.target) === false) {
      return;
    }

    const decision = decidePaste(event.clipboardData?.getData("text/plain") ?? "");

    if (decision.action === "leave") {
      return;
    }

    event.preventDefault();

    if (decision.action === "set") {
      setValue(event.target, decision.value);
    }
  };

  doc.addEventListener("paste", onPaste, true);

  return () => doc.removeEventListener("paste", onPaste, true);
}
