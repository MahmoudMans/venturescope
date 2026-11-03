import { describe, expect, it } from "vitest";

import {
  fieldErrorId,
  fieldErrorProps,
  firstFieldError,
  hasFieldErrors,
} from "@/lib/forms/field-errors";

describe("fieldErrorId", () => {
  it("adds -error to the id of the field", () => {
    expect(fieldErrorId("startingCash")).toBe("startingCash-error");
  });

  it("keeps ids with dashes and generated ids as they are", () => {
    expect(fieldErrorId("settings-start-month")).toBe("settings-start-month-error");

    expect(fieldErrorId(":r1:-name")).toBe(":r1:-name-error");
  });
});

describe("firstFieldError", () => {
  it("gives the first message of the field", () => {
    expect(firstFieldError({ name: ["Too short", "Not allowed"] }, "name")).toBe("Too short");
  });

  it("gives nothing for a field without messages", () => {
    expect(firstFieldError({ name: ["Too short"] }, "email")).toBeUndefined();

    expect(firstFieldError({ name: [] }, "name")).toBeUndefined();

    expect(firstFieldError({ name: undefined }, "name")).toBeUndefined();
  });

  it("gives nothing for an empty message or for no errors at all", () => {
    expect(firstFieldError({ name: [""] }, "name")).toBeUndefined();

    expect(firstFieldError(undefined, "name")).toBeUndefined();
  });
});

describe("hasFieldErrors", () => {
  it("is false when there are no errors", () => {
    expect(hasFieldErrors(undefined)).toBe(false);

    expect(hasFieldErrors({})).toBe(false);
  });

  it("is false when every list is empty", () => {
    expect(hasFieldErrors({ name: [], email: undefined })).toBe(false);

    expect(hasFieldErrors({ name: [""] })).toBe(false);
  });

  it("is true when one field has a message", () => {
    expect(hasFieldErrors({ name: [], email: ["Enter an email"] })).toBe(true);
  });
});

describe("fieldErrorProps", () => {
  it("marks the field as wrong and points to the message", () => {
    expect(fieldErrorProps("startingCash", "Must be 0 or more")).toEqual({
      "aria-invalid": true,
      "aria-describedby": "startingCash-error",
    });
  });

  it("gives a field without a message no attributes at all", () => {
    expect(fieldErrorProps("startingCash", undefined)).toEqual({});

    expect(fieldErrorProps("startingCash", null)).toEqual({});

    expect(fieldErrorProps("startingCash", "")).toEqual({});
  });

  it("uses the same id as the message under the field", () => {
    const props = fieldErrorProps("settings-name", "Required");

    expect(props["aria-describedby"]).toBe(fieldErrorId("settings-name"));
  });

  it("does not have the key when there is no message", () => {
    expect("aria-invalid" in fieldErrorProps("x", undefined)).toBe(false);

    expect("aria-describedby" in fieldErrorProps("x", undefined)).toBe(false);
  });
});
