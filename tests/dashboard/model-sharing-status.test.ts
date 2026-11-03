import { describe, expect, it } from "vitest";

import { getModelNotice } from "@/lib/dashboard/model-notices";
import {
  MODEL_FILTER_OPTIONS,
  filterAndSortModels,
  type ModelStatusFilter,
} from "@/lib/dashboard/model-list";
import {
  describeDeleteWarning,
  describeModelCount,
  describeSharedTag,
  isSharedModel,
  toDashboardSharing,
  workspaceForPerson,
  type DashboardSharing,
} from "@/lib/dashboard/model-sharing-status";
import type { DashboardModel } from "@/lib/dashboard/summary";

const sharedIn = (others: number, name = "Finance"): DashboardSharing => ({
  workspaceId: "w1",
  workspaceName: name,
  others,
});

describe("workspaceForPerson", () => {
  const row = {
    id: "w1",
    name: "Finance",
    ownerId: "owner",
    _count: { members: 4 },
    members: [] as unknown[],
  };

  it("returns nothing for a model that is in no workspace", () => {
    expect(workspaceForPerson(null, "owner")).toBe(null);
  });

  it("passes the id, the name and the number of collaborators on", () => {
    expect(workspaceForPerson(row, "someone")).toEqual({
      id: "w1",
      name: "Finance",
      memberCount: 4,
      personIsInside: false,
    });
  });

  it("knows a person is inside when they own the workspace", () => {
    expect(workspaceForPerson(row, "owner")?.personIsInside).toBe(true);
  });

  it("knows a person is inside when they have a membership row", () => {
    expect(workspaceForPerson({ ...row, members: [{ id: "m1" }] }, "someone")?.personIsInside).toBe(
      true,
    );
  });

  it("is not fooled by a person who is neither the owner nor a collaborator", () => {
    expect(workspaceForPerson({ ...row, members: [] }, "stranger")?.personIsInside).toBe(false);
  });
});

describe("toDashboardSharing", () => {
  it("returns nothing for a private model", () => {
    expect(toDashboardSharing(null)).toBe(null);
  });

  it("does not count the owner of the model twice when they are in the workspace", () => {
    expect(
      toDashboardSharing({ id: "w1", name: "Finance", memberCount: 2, personIsInside: true }),
    ).toEqual({ workspaceId: "w1", workspaceName: "Finance", others: 2 });
  });

  it("counts the owner of the workspace when the owner of the model left", () => {
    expect(
      toDashboardSharing({ id: "w1", name: "Finance", memberCount: 2, personIsInside: false }),
    ).toEqual({ workspaceId: "w1", workspaceName: "Finance", others: 3 });

    expect(
      toDashboardSharing({ id: "w1", name: "Finance", memberCount: 0, personIsInside: false })
        ?.others,
    ).toBe(1);
  });
});

describe("isSharedModel", () => {
  it("is false when the field is missing or empty", () => {
    expect(isSharedModel({})).toBe(false);

    expect(isSharedModel({ sharing: null })).toBe(false);

    expect(isSharedModel({ sharing: undefined })).toBe(false);
  });

  it("is true for a model with a workspace, even when nobody else joined", () => {
    expect(isSharedModel({ sharing: sharedIn(0) })).toBe(true);

    expect(isSharedModel({ sharing: sharedIn(3) })).toBe(true);
  });
});

describe("describeSharedTag", () => {
  it("names the workspace when nobody else can open the model", () => {
    expect(describeSharedTag(sharedIn(0))).toBe("Shared in Finance");
  });

  it("says how many other people can open it", () => {
    expect(describeSharedTag(sharedIn(1))).toBe("Shared in Finance with 1 other person");

    expect(describeSharedTag(sharedIn(2))).toBe("Shared in Finance with 2 other people");

    expect(describeSharedTag(sharedIn(12, "Board"))).toBe("Shared in Board with 12 other people");
  });
});

describe("describeModelCount", () => {
  it("uses the singular for one model and the plural for the others", () => {
    expect(describeModelCount(1, 0)).toBe("1 financial model");

    expect(describeModelCount(0, 0)).toBe("0 financial models");

    expect(describeModelCount(7, 0)).toBe("7 financial models");
  });

  it("adds how many are shared, only when some are", () => {
    expect(describeModelCount(3, 1)).toBe("3 financial models, 1 shared with a workspace");

    expect(describeModelCount(1, 1)).toBe("1 financial model, 1 shared with a workspace");

    expect(describeModelCount(5, 5)).toBe("5 financial models, 5 shared with a workspace");
  });
});

describe("describeDeleteWarning", () => {
  it("says nothing when nobody else can open the model", () => {
    expect(describeDeleteWarning(null)).toBe(null);

    expect(describeDeleteWarning(undefined)).toBe(null);

    expect(describeDeleteWarning(sharedIn(0))).toBe(null);
  });

  it("tells how many people lose access and where they have it", () => {
    const one = describeDeleteWarning(sharedIn(1));

    expect(one).toContain("This model is shared in Finance.");

    expect(one).toContain("1 other person can open it now and will lose access.");

    const many = describeDeleteWarning(sharedIn(4, "Board"));

    expect(many).toContain("This model is shared in Board.");

    expect(many).toContain("4 other people can open it now and will lose access.");
  });

  it("points to Stop sharing as the way to keep the model", () => {
    const text = describeDeleteWarning(sharedIn(2)) ?? "";

    expect(text).toContain("press Cancel and use Stop sharing in the Settings of the model.");
  });
});

describe("model list filter", () => {
  function model(id: string, sharing?: DashboardSharing | null, name = `Model ${id}`) {
    const base: DashboardModel = {
      id,
      name,
      industry: null,
      currency: "EUR",
      startMonth: new Date("2027-01-01T00:00:00.000Z"),
      horizonMonths: 36,
      revenueMode: "DIRECT",
      updatedAt: new Date(`2027-01-0${id}T00:00:00.000Z`),
      scenarioCount: 3,
      status: "READY",
      completedSections: 3,
      snapshot: null,
      metrics: null,
    };

    return sharing === undefined ? base : { ...base, sharing };
  }

  const models = [
    model("1", sharedIn(2), "Alpha"),
    model("2", null, "Beta"),
    model("3", undefined, "Gamma"),
    model("4", sharedIn(0), "Delta"),
  ];

  const ids = (status: ModelStatusFilter, query = "") =>
    filterAndSortModels(models, { query, sort: "name", status }).map((item) => item.id);

  it("keeps every model for All models", () => {
    expect(ids("all")).toEqual(["1", "2", "4", "3"]);
  });

  it("keeps the models that are shared, even when nobody else joined", () => {
    expect(ids("shared")).toEqual(["1", "4"]);
  });

  it("keeps the models that are private, including the ones without the field", () => {
    expect(ids("private")).toEqual(["2", "3"]);
  });

  it("works together with the search", () => {
    expect(ids("shared", "alp")).toEqual(["1"]);

    expect(ids("private", "alp")).toEqual([]);

    expect(ids("private", "gam")).toEqual(["3"]);
  });

  it("keeps the older filters working", () => {
    const setup = { ...model("5", sharedIn(1)), status: "SETUP_REQUIRED" as const };

    const list = [model("6"), setup];

    expect(
      filterAndSortModels(list, { query: "", sort: "name", status: "setup" }).map((m) => m.id),
    ).toEqual(["5"]);

    expect(
      filterAndSortModels(list, { query: "", sort: "name", status: "ready" }).map((m) => m.id),
    ).toEqual(["6"]);
  });
});

describe("MODEL_FILTER_OPTIONS", () => {
  const values = MODEL_FILTER_OPTIONS.map((option) => option.value);

  it("starts with All models and offers every filter once", () => {
    expect(values[0]).toBe("all");

    expect(new Set(values).size).toBe(values.length);

    expect([...values].sort()).toEqual(["all", "private", "ready", "setup", "shared"]);
  });

  it("has a clear label for each one", () => {
    expect(MODEL_FILTER_OPTIONS.map((option) => option.label)).toEqual([
      "All models",
      "Forecast ready",
      "Needs setup",
      "Shared with a workspace",
      "Private to me",
    ]);
  });
});

describe("getModelNotice", () => {
  it("confirms a delete and a rename", () => {
    expect(getModelNotice("model-deleted")).toEqual({
      tone: "success",
      message: "The model was deleted.",
    });

    expect(getModelNotice("model-renamed")).toEqual({
      tone: "success",
      message: "The model was renamed.",
    });
  });

  it("tells when a delete or a copy failed, and that nothing was changed", () => {
    const deleteFailed = getModelNotice("delete-failed");

    expect(deleteFailed?.tone).toBe("error");

    expect(deleteFailed?.message).toContain("Nothing was changed");

    const copyFailed = getModelNotice("copy-failed");

    expect(copyFailed?.tone).toBe("error");

    expect(copyFailed?.message).toContain("Nothing was saved");
  });

  it("tells without alarm when the model was not found", () => {
    expect(getModelNotice("model-missing")).toEqual({
      tone: "info",
      message: "That model was not found. It may already be deleted.",
    });
  });

  it("shows nothing for any other value", () => {
    for (const code of [
      undefined,
      "",
      "sample-failed",
      "MODEL-DELETED",
      "model-deleted ",
      "constructor",
      "__proto__",
      "toString",
    ]) {
      expect(getModelNotice(code)).toBe(null);
    }
  });

  it("shows nothing when the value is repeated in the address", () => {
    expect(getModelNotice(["model-deleted"])).toBe(null);

    expect(getModelNotice(["model-deleted", "model-deleted"])).toBe(null);
  });
});
