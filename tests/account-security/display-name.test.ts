import { describe, expect, it } from "vitest";

import { firstNameOf, pickDisplayName } from "@/lib/account/display-name";

describe("pickDisplayName", () => {
  it("prefers the saved name over the one kept in the session", () => {
    expect(pickDisplayName("Ada Lovelace", "Old Name")).toBe("Ada Lovelace");
  });

  it("falls back to the session name when nothing is saved", () => {
    expect(pickDisplayName(null, "Old Name")).toBe("Old Name");

    expect(pickDisplayName(undefined, "Old Name")).toBe("Old Name");

    expect(pickDisplayName("   ", "Old Name")).toBe("Old Name");
  });

  it("trims what it returns and is empty when both names are missing", () => {
    expect(pickDisplayName("  Ada  ", null)).toBe("Ada");

    expect(pickDisplayName(null, undefined)).toBe("");

    expect(pickDisplayName("", "  ")).toBe("");
  });
});

describe("firstNameOf", () => {
  it("returns the first word", () => {
    expect(firstNameOf("Ada Lovelace")).toBe("Ada");

    expect(firstNameOf("  Grace   Brewster Hopper ")).toBe("Grace");

    expect(firstNameOf("Plato")).toBe("Plato");
  });

  it("stays empty for an empty name", () => {
    expect(firstNameOf("")).toBe("");

    expect(firstNameOf("   ")).toBe("");
  });
});
