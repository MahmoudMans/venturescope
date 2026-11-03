import { workspaceRoleLabel } from "@/lib/workspaces/labels";
import type { WorkspacePermission } from "@/lib/workspaces/permissions";
import {
  ownerDisplayName,
  resolveWorkspaceRole,
  type WorkspaceRoleInput,
} from "@/lib/workspaces/shared-role";

/** What the loader reads for every model that lives in someone else's workspace. */
export type SharedModelRow = {
  id: string;

  userId: string;

  name: string;

  industry: string | null;

  currency: string;

  horizonMonths: number;

  updatedAt: Date;

  user: {
    name: string;
  };

  workspace: ({ id: string; name: string } & WorkspaceRoleInput) | null;
};

export type SharedModel = {
  id: string;

  name: string;

  industry: string | null;

  currency: string;

  horizonMonths: number;

  updatedAt: Date;

  ownerName: string;

  workspaceId: string;

  workspaceName: string;

  role: WorkspacePermission;
};

/**
 * Shapes database rows into the dashboard cards. A model the person owns, or
 * one that is no longer in a workspace, never appears here.
 */
export function toSharedModels(rows: ReadonlyArray<SharedModelRow>, userId: string): SharedModel[] {
  const models: SharedModel[] = [];

  for (const row of rows) {
    if (row.userId === userId || row.workspace === null) {
      continue;
    }

    models.push({
      id: row.id,

      name: row.name,

      industry: row.industry,

      currency: row.currency,

      horizonMonths: row.horizonMonths,

      updatedAt: row.updatedAt,

      ownerName: ownerDisplayName(row.user.name),

      workspaceId: row.workspace.id,

      workspaceName: row.workspace.name,

      role: resolveWorkspaceRole(userId, row.workspace),
    });
  }

  return models;
}

/** The search palette hint: the workspace name and the person's role. */
export function sharedModelHint(model: Pick<SharedModel, "workspaceName" | "role">): string {
  return `Shared in ${model.workspaceName} \u00b7 ${workspaceRoleLabel(model.role)}`;
}
