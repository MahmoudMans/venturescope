type TypedField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** What one box of a form looked like at the moment the person pressed save. */
export type FieldSnapshot = {
  element: TypedField;
  value: string;
  checked: boolean;
  selected: boolean[];
};

/**
 * Boxes that are never put back. A password is not kept after a failed try, a hidden box is set by
 * the page and not by the person, and a file box cannot be filled by a script.
 */
const SKIPPED_INPUT_TYPES = new Set([
  "hidden",
  "password",
  "file",
  "submit",
  "button",
  "reset",
  "image",
]);

function isTypedField(element: Element): element is TypedField {
  if (element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
    return true;
  }

  if (element.tagName !== "INPUT") {
    return false;
  }

  return SKIPPED_INPUT_TYPES.has((element as HTMLInputElement).type) === false;
}

function isChoice(element: TypedField): boolean {
  const type = (element as HTMLInputElement).type;

  return element.tagName === "INPUT" && (type === "checkbox" || type === "radio");
}

/** Remembers what the person typed or picked in every box that they can change. */
export function takeFormSnapshot(form: HTMLFormElement): FieldSnapshot[] {
  return Array.from(form.elements)
    .filter(isTypedField)
    .map((element) => ({
      element,
      value: element.value,
      checked: isChoice(element) ? (element as HTMLInputElement).checked : false,
      selected:
        element.tagName === "SELECT"
          ? Array.from((element as HTMLSelectElement).options).map((option) => option.selected)
          : [],
    }));
}

/**
 * Puts back what the person typed. React 19 sets every box of a form back to its saved value when
 * a save finishes, even when the save failed. Without this, the person loses all the changes, and the
 * red message points to a box that shows the old number.
 */
export function restoreFormSnapshot(snapshot: FieldSnapshot[]): void {
  for (const entry of snapshot) {
    const { element } = entry;

    if (element.isConnected === false) {
      continue;
    }

    if (element.tagName === "SELECT") {
      const select = element as HTMLSelectElement;

      if (select.multiple) {
        entry.selected.forEach((flag, index) => {
          if (select.options[index] !== undefined) {
            select.options[index].selected = flag;
          }
        });
      } else {
        select.value = entry.value;
      }
    } else if (isChoice(element)) {
      (element as HTMLInputElement).checked = entry.checked;
    } else {
      element.value = entry.value;
    }
  }
}
