import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MAX_BACKUP_BYTES } from "@/lib/projects/backup-limits";

const action = readFileSync("app/(app)/projects/import-action.ts", "utf8");

const route = readFileSync("app/api/projects/[projectId]/export/json/route.ts", "utf8");

const form = readFileSync("components/projects/import-model-form.tsx", "utf8");

const newModelPage = readFileSync("app/(app)/projects/new/page.tsx", "utf8");

const settingsPage = readFileSync("app/(app)/projects/[projectId]/settings/page.tsx", "utf8");

const projectActions = readFileSync("components/projects/project-actions.tsx", "utf8");

const nextConfig = readFileSync("next.config.ts", "utf8");

describe("restore action source", () => {
  it("is a server action for the signed-in person that takes only the file", () => {
    expect(action).toContain('"use server"');

    expect(action).toContain("requireUser");

    expect(action).toContain('formData.get("backup")');

    expect(action).not.toContain('formData.get("userId")');

    expect(action).not.toContain('formData.get("projectId")');
  });

  it("refuses a missing or oversized file before reading it", () => {
    const size = action.indexOf("file.size > MAX_BACKUP_BYTES");

    const read = action.indexOf("file.text()");

    expect(size).toBeGreaterThan(-1);

    expect(read).toBeGreaterThan(size);

    expect(action).toContain("entry instanceof File");

    expect(action).toContain("We could not read this file");
  });

  it("checks the whole file and its forecast before anything is saved", () => {
    const parse = action.indexOf("parseModelBackup(text)");

    const calculate = action.indexOf("findBackupCalculationProblem(parsed.model)");

    const save = action.indexOf("prisma.$transaction");

    expect(parse).toBeGreaterThan(-1);

    expect(calculate).toBeGreaterThan(parse);

    expect(save).toBeGreaterThan(calculate);
  });

  it("saves the model, its scenarios, financing and overrides in one transaction", () => {
    expect(action).toContain("transaction.project.create");

    expect(action).toContain("scenarios: {");

    expect(action).toContain("transaction.financingEvent.createMany");

    expect(action).toContain("transaction.monthlyOverride.createMany");
  });

  it("always makes a new model for the signed-in person and never overwrites", () => {
    expect(action.match(/userId: user\.id/g)?.length ?? 0).toBeGreaterThanOrEqual(2);

    expect(action).toContain("restoredModelName(model.name, sameName !== null)");

    expect(action).not.toContain(".update(");

    expect(action).not.toContain(".delete");
  });

  it("answers a failure with a message instead of a half-saved model", () => {
    expect(action).toContain("Nothing was saved");

    expect(action).toContain("console.error");
  });

  it("opens the restored model", () => {
    expect(action).toContain('revalidatePath("/dashboard")');

    expect(action).toContain("/overview");
  });
});

describe("backup download route source", () => {
  it("answers 401 without a session and 404 when the model cannot be opened", () => {
    expect(route).toContain("status: 401");

    expect(route).toContain("status: 404");

    expect(route).toContain("auth()");
  });

  it("uses the same visibility rule as the model pages", () => {
    expect(route).toContain("getOwnedProject(userId, projectId)");

    const visible = route.indexOf("getOwnedProject(userId, projectId)");

    const load = route.indexOf("prisma.project.findUnique");

    expect(load).toBeGreaterThan(visible);
  });

  it("sends the file as a private download that is never cached", () => {
    expect(route).toContain("attachment; filename=");

    expect(route).toContain("private, no-store");

    expect(route).toContain("nosniff");

    expect(route).toContain('export const dynamic = "force-dynamic"');
  });
});

describe("backup upload limit", () => {
  it("stays below the upload limit of server actions", () => {
    const match = nextConfig.match(/bodySizeLimit:\s*"(\d+)kb"/);

    expect(match).not.toBe(null);

    const limit = Number(match?.[1]) * 1024;

    expect(MAX_BACKUP_BYTES + 20_000).toBeLessThan(limit);
  });
});

describe("backup screens source", () => {
  it("offers the download in the model menu and on the settings page", () => {
    expect(projectActions).toContain("/export/json");

    expect(projectActions).toContain("Download backup");

    expect(settingsPage).toContain("/export/json");

    expect(settingsPage).toContain("Download backup");
  });

  it("offers the restore form on the new model page", () => {
    expect(newModelPage).toContain("<ImportModelForm");

    expect(newModelPage).toContain("Restore from a backup");
  });

  it("keeps the validation code out of the browser", () => {
    expect(form).toContain("importModelAction");

    expect(form).toContain("useActionState");

    expect(form).toContain("@/lib/projects/backup-limits");

    expect(form).not.toContain("@/lib/projects/model-backup");

    expect(form).not.toContain("zod");
  });

  it("accepts only JSON files and shows a size problem before uploading", () => {
    expect(form).toContain('accept="application/json,.json"');

    expect(form).toContain("MAX_BACKUP_BYTES");

    expect(form).toContain("disabled={tooLarge}");
  });
});
