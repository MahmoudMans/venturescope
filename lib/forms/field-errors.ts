/** The messages the server sends back for each field of a form. */
export type FieldErrors = Record<string, string[] | undefined> | undefined;

/** The id of the message under a field. The field and its message share this id. */
export function fieldErrorId(fieldId: string): string {
  return `${fieldId}-error`;
}

/** The first message for a field, or nothing when the field is fine. */
export function firstFieldError(errors: FieldErrors, name: string): string | undefined {
  const message = errors?.[name]?.[0];

  return message === undefined || message === "" ? undefined : message;
}

/** True when at least one field has a message. */
export function hasFieldErrors(errors: FieldErrors): boolean {
  if (errors === undefined) {
    return false;
  }

  return Object.values(errors).some((messages) => (messages?.[0] ?? "") !== "");
}

/**
 * The attributes that tell a screen reader that a field is wrong and where the reason is.
 * A field without a message gets no attributes at all.
 */
export function fieldErrorProps(
  fieldId: string,
  message: string | null | undefined,
): { "aria-invalid"?: true; "aria-describedby"?: string } {
  if (message === undefined || message === null || message === "") {
    return {};
  }

  return { "aria-invalid": true, "aria-describedby": fieldErrorId(fieldId) };
}
