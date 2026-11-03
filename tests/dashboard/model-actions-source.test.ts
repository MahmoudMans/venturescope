import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getModelNotice } from "@/lib/dashboard/model-notices";
import { HELP_GROUPS } from "@/lib/site/help-content";

const read = (path: string) => readFileSync(path, "utf8");

const actions = read("app/(app)/projects/actions.ts");

const page = read("app/(app)/dashboard/page.tsx");

const card = read("components/projects/project-card.tsx");

const dialog = read("components/projects/project-actions.tsx");

const grid = read("components/dashboard/model-grid.tsx");

const loader = read("lib/dashboard/portfolio-kpis.ts");

const summary = read("lib/dashboard/summary.ts");

const layout = read("app/(app)/projects/[projectId]/layout.tsx");

const readme = read("README.md");

/**
 * The text without spaces, line breaks and trailing commas, so the checks do
 * not depend on how the code is laid out.
 */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when the squashed text contains the squashed piece. */
const has = (text: string, piece: string) => squash(text).includes(squash(piece));

/** The place of each marker in the squashed text, in the order they are given. */
function positions(text: string, markers: string[]): number[] {
  const body = squash(text);

  return markers.map((marker) => body.indexOf(squash(marker)));
}

/** True when every value was found and each one comes after the one before it. */
function isIncreasing(values: number[]): boolean {
  return values.every((value, index) => value > -1 && (index === 0 || value > values[index - 1]));
}

/** The text of one exported action, up to the start of the next one (or the end of the file). */
function section(first: string, next: string | null): string {
  const start = actions.indexOf(`export async function ${first}`);

  const end = next === null ? actions.length : actions.indexOf(`export async function ${next}`);

  return start === -1 || end === -1 ? "" : actions.slice(start, end);
}

const rename = section("renameProjectAction", "deleteProjectAction");

const remove = section("deleteProjectAction", "duplicateProjectAction");

const duplicate = section("duplicateProjectAction", null);

describe("delete action", () => {
  it("deletes only a model that the person owns", () => {
    expect(
      has(remove, "prisma.project.deleteMany({ where: { id: parsed.data, userId: user.id, }, })"),
    ).toBe(true);
  });

  it("starts from deleted, and treats a delete that removed nothing as a missing model", () => {
    expect(
      has(
        remove,
        'let outcome: | "model-deleted" | "model-missing" | "delete-failed" = "model-deleted";',
      ),
    ).toBe(true);

    expect(has(remove, "const result = await prisma.project.deleteMany(")).toBe(true);

    expect(has(remove, 'if ( result.count === 0 ) { outcome = "model-missing"; }')).toBe(true);
  });

  it("reports a failure instead of looking like a success", () => {
    expect(
      has(
        remove,
        'catch (error) { console.error( "VentureScope project deletion failed:", error, ); outcome = "delete-failed"; }',
      ),
    ).toBe(true);
  });

  it("goes to the dashboard with the outcome, once, after the work is done", () => {
    expect(has(remove, "redirect( `/dashboard?status=${outcome}`, );")).toBe(true);

    expect(
      isIncreasing(
        positions(remove, [
          "try {",
          "prisma.project.deleteMany(",
          "} catch (error) {",
          'outcome = "delete-failed";',
          'revalidatePath("/dashboard")',
          "redirect( `/dashboard?status=${outcome}`",
        ]),
      ),
    ).toBe(true);

    // One redirect for an invalid id and one at the end. None inside the try block.
    expect(remove.match(/redirect\(/g)?.length).toBe(2);
  });

  it("refreshes the dashboard and every workspace page that listed the model", () => {
    expect(has(remove, 'revalidatePath("/dashboard")')).toBe(true);

    expect(has(remove, 'revalidatePath("/workspaces", "layout")')).toBe(true);
  });

  it("does not touch the activity records", () => {
    expect(remove).not.toContain("projectAuditEvent");
  });
});

describe("rename and copy actions", () => {
  it("send a person back to the dashboard with a message after a rename", () => {
    expect(has(rename, ': "/dashboard?status=model-renamed";')).toBe(true);

    // The model page is the only other place, and only when the form named exactly that path.
    expect(has(rename, "requestedReturnTo === projectReturnTo ? projectReturnTo")).toBe(true);
  });

  it("say when the model to copy was not found", () => {
    expect(
      has(duplicate, 'if (\u0021source) { redirect( "/dashboard?status=model-missing", ); }'),
    ).toBe(true);
  });

  it("say when the copy failed, and still open the copy when it worked", () => {
    expect(
      isIncreasing(
        positions(duplicate, [
          '"VentureScope project duplication failed:"',
          'redirect( "/dashboard?status=copy-failed"',
          "revalidatePath(",
          "redirect( `/projects/${duplicateId}/overview`",
        ]),
      ),
    ).toBe(true);
  });

  it("make a copy that is in no workspace", () => {
    expect(duplicate).not.toContain("workspaceId");
  });
});

describe("status codes", () => {
  it("are all understood by the dashboard", () => {
    const written = [...actions.matchAll(/status=([a-z-]+)/g)].map((match) => match[1]);

    expect(written.length).toBeGreaterThanOrEqual(4);

    for (const code of [...written, "model-deleted", "model-missing", "delete-failed"]) {
      expect(getModelNotice(code), code).not.toBe(null);
    }
  });

  it("are all used by the actions, so the dashboard has no message that nothing can send", () => {
    for (const code of [
      "model-deleted",
      "model-renamed",
      "model-missing",
      "delete-failed",
      "copy-failed",
    ]) {
      expect(actions, code).toContain(code);
    }
  });
});

describe("dashboard page", () => {
  it("shows the sample message or the model message, whichever the address asks for", () => {
    expect(has(page, "const notice = getSampleNotice(status) ?? getModelNotice(status);")).toBe(
      true,
    );

    expect(
      has(
        page,
        "{notice ? <StatusNotice tone={notice.tone}>{notice.message}</StatusNotice> : null}",
      ),
    ).toBe(true);
  });

  it("says how many models are shared", () => {
    expect(has(page, "const sharedCount = models.filter(isSharedModel).length;")).toBe(true);

    expect(has(page, "{describeModelCount(models.length, sharedCount)}")).toBe(true);
  });
});

describe("loader", () => {
  it("reads the workspace of each model with the count and only the own membership", () => {
    expect(
      has(
        loader,
        "workspace: { select: { id: true, name: true, ownerId: true, _count: { select: { members: true } }, members: { where: { userId }, select: { id: true }, take: 1 } } }",
      ),
    ).toBe(true);
  });

  it("still lists only the models the person owns", () => {
    expect(has(loader, "prisma.project.findMany({ where: { userId },")).toBe(true);
  });

  it("puts the sharing on every model", () => {
    expect(
      has(loader, "sharing: toDashboardSharing(workspaceForPerson(project.workspace, userId))"),
    ).toBe(true);

    expect(has(summary, "sharing?: DashboardSharing | null;")).toBe(true);
  });

  it("only reads", () => {
    for (const write of ["create", "update", "delete", "upsert"]) {
      expect(loader, write).not.toContain(`.${write}(`);

      expect(loader, write).not.toContain(`.${write}Many(`);
    }
  });
});

describe("model card", () => {
  it("takes the sharing, private by default, and gives the delete warning to the menu", () => {
    expect(has(card, "sharing = null,")).toBe(true);

    expect(has(card, "sharing?: DashboardSharing | null;")).toBe(true);

    expect(has(card, "deleteWarning={describeDeleteWarning(sharing)}")).toBe(true);
  });

  it("shows the tag only for a shared model, above the figures, and links to the Sharing card", () => {
    expect(
      isIncreasing(
        positions(card, [
          "<CardContent",
          "{sharing ? (",
          "href={`/projects/${project.id}/settings#sharing`}",
          "{describeSharedTag(sharing)}",
          "{snapshot ? (",
        ]),
      ),
    ).toBe(true);
  });
});

describe("delete dialog", () => {
  it("takes an optional warning, empty by default", () => {
    expect(has(dialog, "deleteWarning?: string | null;")).toBe(true);

    expect(has(dialog, "deleteWarning = null, }: ProjectActionsProps")).toBe(true);
  });

  it("shows the warning under the description and above the buttons", () => {
    expect(
      isIncreasing(
        positions(dialog, [
          "<AlertDialogDescription>",
          "</AlertDialogDescription>",
          "{deleteWarning ? (",
          'role="note"',
          "{deleteWarning}",
          "</AlertDialogHeader>",
          "<AlertDialogFooter",
        ]),
      ),
    ).toBe(true);
  });

  it("lists what is deleted, says it cannot be undone and suggests a backup", () => {
    const text = dialog.replace(/\s+/g, " ");

    expect(text).toContain(
      "This permanently deletes the model and everything inside it: scenarios, financing events, monthly overrides, actuals, versions, reviews, approvals and imports.",
    );

    expect(text).toContain("It cannot be undone.");

    expect(text).toContain("Download a backup first if you might need it again.");

    expect(text).not.toContain("belonging to it");
  });

  it("still deletes with the model id", () => {
    expect(has(dialog, "<form action={ deleteProjectAction }>")).toBe(true);

    expect(has(dialog, '<input type="hidden" name="projectId" value={ projectId } />')).toBe(true);
  });
});

describe("model grid", () => {
  it("builds the filter list from one place, with the shared and private choices", () => {
    expect(
      has(
        grid,
        "{MODEL_FILTER_OPTIONS.map((option) => ( <option key={option.value} value={option.value}> {option.label} </option> ))}",
      ),
    ).toBe(true);

    expect(grid).not.toContain('<option value="all">');
  });

  it("gives each card its sharing", () => {
    expect(has(grid, "sharing={model.sharing ?? null}")).toBe(true);
  });
});

describe("model header", () => {
  it("gives the delete dialog the same warning as the cards", () => {
    expect(
      has(layout, "deleteWarning={describeDeleteWarning(toDashboardSharing(ownerSharing))}"),
    ).toBe(true);

    expect(
      has(
        layout,
        'import { describeDeleteWarning, toDashboardSharing } from "@/lib/dashboard/model-sharing-status";',
      ),
    ).toBe(true);
  });
});

describe("Help", () => {
  const items = HELP_GROUPS.flatMap((group) => group.items);

  const item = items.find((candidate) => candidate.id === "delete-model");

  it("answers how to delete and how to copy a model", () => {
    expect(item?.question).toBe("How do I delete or copy a model?");

    expect(item?.answer).toHaveLength(3);
  });

  it("says what is lost, who loses access, and how to keep the model", () => {
    const text = (item?.answer ?? []).join(" ");

    expect(text).toContain("removed for good");

    expect(text).toContain("Download a backup first");

    expect(text).toContain("everyone in that workspace loses access");

    expect(text).toContain("use Stop sharing in its Settings instead");

    expect(text).toContain("Only the person who owns a model can delete it.");
  });

  it("says what a copy contains and that it is private", () => {
    const text = (item?.answer ?? []).join(" ");

    expect(text).toContain("Duplicate makes a private copy");

    expect(text).toContain("are not copied");

    expect(text).toContain("never shared");
  });
});

describe("README", () => {
  it("has a section about the dashboard", () => {
    const start = readme.indexOf("## Delete, copy and share from the dashboard");

    expect(start).toBeGreaterThan(-1);

    const next = readme.indexOf("\n## ", start + 1);

    expect(next).toBeGreaterThan(start);

    const text = readme.slice(start, next).replace(/\s+/g, " ");

    expect(text).toContain('"Shared in ..."');

    expect(text).toContain("Private to me");

    expect(text).toContain("cannot be undone");

    expect(text).toContain("no longer looks like it worked");

    expect(text).toContain("ProjectAuditEvent");
  });
});
