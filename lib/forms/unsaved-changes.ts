import { type FieldSnapshot, takeFormSnapshot } from "@/lib/forms/form-snapshot";

/**
 * One text that stands for everything a person can see and change in a form: the name, the value,
 * the choice and the selected options of every box, in the order of the page. Two forms with the
 * same text look the same. A box that is added or removed changes the text too.
 */
export function snapshotSignature(snapshot: FieldSnapshot[]): string {
  return snapshot
    .map(({ element, value, checked, selected }) =>
      [
        element.name,
        value,
        checked ? "1" : "0",
        selected.map((flag) => (flag ? "1" : "0")).join(""),
      ].join("\u0001"),
    )
    .join("\u0002");
}

/**
 * The hidden boxes of a form. The page sets them, but some of them hold a choice of the person: a
 * button that picks the cost method or the growth period changes a hidden box and no visible one.
 */
export function hiddenSignature(form: HTMLFormElement): string {
  return Array.from(form.elements)
    .filter(
      (element) => element.tagName === "INPUT" && (element as HTMLInputElement).type === "hidden",
    )
    .map((element) =>
      [(element as HTMLInputElement).name, (element as HTMLInputElement).value].join("\u0001"),
    )
    .join("\u0002");
}

type KeyLike = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

/** Ctrl+S on Windows and Linux, Cmd+S on a Mac. Other keys with Shift or Alt are not a save. */
export function isSaveShortcut(event: KeyLike): boolean {
  return (
    event.key.toLowerCase() === "s" &&
    (event.ctrlKey || event.metaKey) &&
    event.altKey === false &&
    event.shiftKey === false
  );
}

export type UnsavedTracker = {
  /** Takes what the form shows now as the saved state. */
  markSaved: () => void;
  /** True when the form shows something other than the saved state. */
  isDirty: () => boolean;
  /** Stops listening to the form. */
  stop: () => void;
};

/** A number box that had the cursor when the form was sent, and what it showed then. */
type SentNumber = {
  element: HTMLInputElement;
  sent: string;
  before: string;
};

function numberWithCursor(form: HTMLFormElement, active: Element | null): SentNumber | null {
  if (active === null || form.contains(active) === false) {
    return null;
  }

  const element = active as HTMLInputElement;

  if (element.type !== "number") {
    return null;
  }

  return { element, sent: element.value, before: element.defaultValue };
}

type TrackerOptions = {
  /** Called each time the form becomes dirty or clean again, and not more often than that. */
  onChange: (dirty: boolean) => void;
  /** Runs a function after React has drawn the page again. The default waits one tick. */
  later?: (run: () => void) => void;
  /** Calls the function when boxes are added to or removed from the form. Returns a stop function. */
  watchBoxes?: (form: HTMLFormElement, run: () => void) => () => void;
  /** The box that has the cursor now. The default is the active element of the page. */
  activeElement?: () => Element | null;
};

function runLater(run: () => void): void {
  setTimeout(run, 0);
}

function watchWithObserver(form: HTMLFormElement, run: () => void): () => void {
  if (typeof MutationObserver === "undefined") {
    return () => undefined;
  }

  const observer = new MutationObserver(run);

  observer.observe(form, { childList: true, subtree: true });

  return () => observer.disconnect();
}

/**
 * Watches a form and tells when the person has changed something that is not saved. The state that
 * was shown when the page opened is the saved state, until `markSaved` is called. A person who
 * types a change and then types the old value back has no unsaved change.
 *
 * It also turns Ctrl+S (Cmd+S) in the form into a save, so the browser does not offer to save the page.
 */
export function trackUnsavedChanges(
  form: HTMLFormElement,
  options: TrackerOptions,
): UnsavedTracker {
  const later = options.later ?? runLater;

  const watchBoxes = options.watchBoxes ?? watchWithObserver;

  const activeElement = options.activeElement ?? (() => form.ownerDocument.activeElement);

  const read = () =>
    [snapshotSignature(takeFormSnapshot(form)), hiddenSignature(form)].join("\u0003");

  let saved = read();

  let dirty = false;

  const update = () => {
    const next = read() !== saved;

    if (next !== dirty) {
      dirty = next;

      options.onChange(next);
    }
  };

  // React does not show a new saved number in a number box that has the cursor, and then the end of
  // the save puts the old number back. So the number that was sent is kept in that box.
  let sentNumber: SentNumber | null = null;

  const onSubmit = () => {
    sentNumber = numberWithCursor(form, activeElement());
  };

  const keepSentNumber = () => {
    const entry = sentNumber;

    sentNumber = null;

    if (entry === null) {
      return;
    }

    const { element, sent, before } = entry;

    if (element.isConnected && activeElement() === element && element.value === before) {
      element.defaultValue = sent;

      element.value = sent;
    }
  };

  // A click can remove or add a row. React draws the new page after the click, so the check waits.
  const afterClick = () => later(update);

  const onKeyDown = (event: KeyboardEvent) => {
    if (isSaveShortcut(event)) {
      event.preventDefault();

      // The save button is disabled while a save runs, so a second Ctrl+S does not send it again.
      if (form.querySelector('[type="submit"]:disabled') === null) {
        form.requestSubmit();
      }
    }
  };

  form.addEventListener("input", update);

  form.addEventListener("change", update);

  form.addEventListener("click", afterClick);

  form.addEventListener("keydown", onKeyDown);

  form.addEventListener("submit", onSubmit);

  const stopWatching = watchBoxes(form, update);

  return {
    markSaved() {
      keepSentNumber();

      saved = read();

      if (dirty) {
        dirty = false;

        options.onChange(false);
      }
    },
    isDirty: () => dirty,
    stop() {
      form.removeEventListener("input", update);

      form.removeEventListener("change", update);

      form.removeEventListener("click", afterClick);

      form.removeEventListener("keydown", onKeyDown);

      form.removeEventListener("submit", onSubmit);

      stopWatching();
    },
  };
}
