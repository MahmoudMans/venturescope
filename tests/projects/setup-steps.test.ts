import { describe, expect, it } from "vitest";

import {
  SETUP_STEP_ORDER,
  buildSetupProgress,
  completionFromMissing,
  nextStepAfter,
  setupStepHref,
} from "@/lib/projects/setup-steps";

const NONE = { general: false, revenue: false, expenses: false };

describe("buildSetupProgress", () => {
  it("asks for the sections in a fixed order and marks the first one as next", () => {
    const progress = buildSetupProgress("p1", NONE);

    expect(progress.steps.map((step) => step.key)).toEqual(["general", "revenue", "expenses"]);

    expect(progress.steps.map((step) => step.state)).toEqual(["next", "todo", "todo"]);

    expect(progress.done).toBe(0);

    expect(progress.total).toBe(3);

    expect(progress.percent).toBe(0);

    expect(progress.complete).toBe(false);

    expect(progress.next?.key).toBe("general");
  });

  it("moves the next marker forward as sections are finished", () => {
    const one = buildSetupProgress("p1", { ...NONE, general: true });

    expect(one.steps.map((step) => step.state)).toEqual(["done", "next", "todo"]);

    expect(one.percent).toBe(33);

    expect(one.complete).toBe(false);

    expect(one.next?.key).toBe("revenue");

    const two = buildSetupProgress("p1", { general: true, revenue: true, expenses: false });

    expect(two.steps.map((step) => step.state)).toEqual(["done", "done", "next"]);

    expect(two.percent).toBe(67);

    expect(two.complete).toBe(false);

    expect(two.next?.key).toBe("expenses");
  });

  it("keeps the first unfinished section as next even when a later one is done", () => {
    const progress = buildSetupProgress("p1", { general: false, revenue: true, expenses: false });

    expect(progress.steps.map((step) => step.state)).toEqual(["next", "done", "todo"]);

    expect(progress.done).toBe(1);

    expect(progress.next?.key).toBe("general");
  });

  it("is complete when all three sections are done", () => {
    const progress = buildSetupProgress("p1", { general: true, revenue: true, expenses: true });

    expect(progress.complete).toBe(true);

    expect(progress.percent).toBe(100);

    expect(progress.next).toBeNull();

    expect(progress.steps.every((step) => step.state === "done")).toBe(true);

    expect(progress.steps.every((step) => step.actionLabel === "Review")).toBe(true);
  });

  it("links every section to its own page inside the model", () => {
    const progress = buildSetupProgress("abc123", NONE);

    expect(progress.steps.map((step) => step.href)).toEqual([
      "/projects/abc123/assumptions",
      "/projects/abc123/revenue",
      "/projects/abc123/expenses",
    ]);

    expect(setupStepHref("abc123", "revenue")).toBe("/projects/abc123/revenue");
  });

  it("uses clear action labels", () => {
    const progress = buildSetupProgress("p1", { ...NONE, general: true });

    expect(progress.steps.map((step) => step.actionLabel)).toEqual([
      "Review",
      "Set up now",
      "Set up",
    ]);
  });

  it("describes the revenue section by revenue mode", () => {
    const revenueOf = (mode?: string | null) =>
      buildSetupProgress("p1", NONE, mode).steps.find((step) => step.key === "revenue")
        ?.description;

    expect(revenueOf("DIRECT")).toBe("Starting revenue and growth.");

    expect(revenueOf("CUSTOMER_DRIVEN")).toBe("Customers, pricing and churn.");

    expect(revenueOf(undefined)).toBe("How your business earns revenue.");

    expect(revenueOf(null)).toBe("How your business earns revenue.");

    expect(revenueOf("SOMETHING_NEW")).toBe("How your business earns revenue.");
  });

  it("gives every section a title and a short description", () => {
    for (const step of buildSetupProgress("p1", NONE).steps) {
      expect(step.title.length).toBeGreaterThan(3);

      expect(step.description.endsWith(".")).toBe(true);
    }
  });
});

describe("completionFromMissing", () => {
  it("treats everything that is not missing as done", () => {
    expect(completionFromMissing([])).toEqual({ general: true, revenue: true, expenses: true });

    expect(completionFromMissing(["general", "expenses"])).toEqual({
      general: false,
      revenue: true,
      expenses: false,
    });

    expect(completionFromMissing(["general", "revenue", "expenses"])).toEqual(NONE);
  });

  it("matches the order list", () => {
    expect([...SETUP_STEP_ORDER]).toEqual(["general", "revenue", "expenses"]);
  });
});

describe("nextStepAfter", () => {
  it("skips the section the person is looking at", () => {
    const progress = buildSetupProgress("p1", NONE);

    expect(nextStepAfter(progress, "general")?.key).toBe("revenue");

    expect(nextStepAfter(progress, "revenue")?.key).toBe("general");

    expect(nextStepAfter(progress, "expenses")?.key).toBe("general");
  });

  it("returns the first unfinished section when the current one is already done", () => {
    const progress = buildSetupProgress("p1", { general: true, revenue: false, expenses: false });

    expect(nextStepAfter(progress, "general")?.key).toBe("revenue");
  });

  it("returns null when only the current section is left", () => {
    const progress = buildSetupProgress("p1", { general: true, revenue: true, expenses: false });

    expect(nextStepAfter(progress, "expenses")).toBeNull();
  });

  it("returns null when everything is done", () => {
    const progress = buildSetupProgress("p1", { general: true, revenue: true, expenses: true });

    expect(nextStepAfter(progress, "general")).toBeNull();
  });
});
