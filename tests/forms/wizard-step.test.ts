import { describe, expect, it } from "vitest";

import { errorsBelongToStepOne, WIZARD_STEP_ONE_FIELDS } from "@/lib/projects/wizard-step";

describe("WIZARD_STEP_ONE_FIELDS", () => {
  it("lists the five fields of step 1 and not the revenue model of step 2", () => {
    expect([...WIZARD_STEP_ONE_FIELDS]).toEqual([
      "name",
      "industry",
      "currency",
      "startMonth",
      "horizonMonths",
    ]);

    expect(WIZARD_STEP_ONE_FIELDS).not.toContain("revenueMode");
  });
});

describe("errorsBelongToStepOne", () => {
  it("is false when the server sent no messages", () => {
    expect(errorsBelongToStepOne(undefined)).toBe(false);

    expect(errorsBelongToStepOne({})).toBe(false);

    expect(errorsBelongToStepOne({ name: [], industry: undefined })).toBe(false);
  });

  it("is true for each field of step 1", () => {
    for (const field of WIZARD_STEP_ONE_FIELDS) {
      expect(errorsBelongToStepOne({ [field]: ["Wrong"] })).toBe(true);
    }
  });

  it("is false when only the revenue model is wrong, because step 2 shows it", () => {
    expect(errorsBelongToStepOne({ revenueMode: ["Pick a model"] })).toBe(false);
  });

  it("is true when step 1 and step 2 are both wrong", () => {
    expect(errorsBelongToStepOne({ revenueMode: ["Pick a model"], name: ["Too long"] })).toBe(true);
  });

  it("ignores an empty message", () => {
    expect(errorsBelongToStepOne({ name: [""] })).toBe(false);
  });
});
