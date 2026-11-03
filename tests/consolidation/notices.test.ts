import { describe, expect, it } from "vitest";

import { getConsolidationNotice } from "@/lib/finance/consolidation/notices";

describe("consolidation notices", () => {
  it("confirms every status code the consolidation actions redirect with", () => {
    for (const code of ["settings-saved", "rate-saved", "rate-deleted"]) {
      const notice = getConsolidationNotice(code);

      expect(notice?.tone, code).toBe("success");

      expect(notice?.message.length ?? 0, code).toBeGreaterThan(5);
    }
  });

  it("ignores missing, repeated and unknown codes", () => {
    expect(getConsolidationNotice(undefined)).toBe(null);

    expect(getConsolidationNotice(["rate-saved"])).toBe(null);

    expect(getConsolidationNotice("nope")).toBe(null);

    expect(getConsolidationNotice("toString")).toBe(null);
  });
});
