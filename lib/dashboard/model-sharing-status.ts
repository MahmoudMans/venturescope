import { formatCount } from "@/lib/workspaces/labels";
import { countOtherPeople, type SharedWorkspaceInput } from "@/lib/workspaces/model-sharing";

/** Where the owner of a model shared it, as a model card needs to show it. */
export type DashboardSharing = {
  workspaceId: string;

  workspaceName: string;

  /** How many other people can open the model besides its owner. */
  others: number;
};

/** The workspace row that the loader reads, with the count of collaborators and the own membership. */
export type WorkspaceRow = {
  id: string;

  name: string;

  ownerId: string;

  _count: {
    members: number;
  };

  /** The membership rows of the person who looks, at most one. */
  members: ReadonlyArray<unknown>;
};

/** Turns the workspace row of a model into what the sharing code needs. A private model has none. */
export function workspaceForPerson(
  row: WorkspaceRow | null,
  userId: string,
): SharedWorkspaceInput | null {
  if (row === null) {
    return null;
  }

  return {
    id: row.id,

    name: row.name,

    memberCount: row._count.members,

    personIsInside: row.ownerId === userId || row.members.length > 0,
  };
}

/** A model that is in no workspace has no sharing. */
export function toDashboardSharing(
  workspace: SharedWorkspaceInput | null,
): DashboardSharing | null {
  if (workspace === null) {
    return null;
  }

  return {
    workspaceId: workspace.id,

    workspaceName: workspace.name,

    others: countOtherPeople(workspace),
  };
}

/** True when the model is shared in a workspace. A model without the field counts as private. */
export function isSharedModel(model: { sharing?: DashboardSharing | null }): boolean {
  return (model.sharing ?? null) !== null;
}

/** The tag on a model card: "Shared in Finance" or "Shared in Finance with 2 other people". */
export function describeSharedTag(sharing: DashboardSharing): string {
  const text = `Shared in ${sharing.workspaceName}`;

  if (sharing.others === 0) {
    return text;
  }

  return `${text} with ${formatCount(sharing.others, "other person", "other people")}`;
}

/** The line under "Your models": "3 financial models, 1 shared with a workspace". */
export function describeModelCount(total: number, shared: number): string {
  const text = `${total} ${total === 1 ? "financial model" : "financial models"}`;

  return shared > 0 ? `${text}, ${shared} shared with a workspace` : text;
}

/**
 * The extra warning in the delete dialog. It appears only when other people can open the model,
 * because only then does deleting take something away from someone else.
 */
export function describeDeleteWarning(sharing: DashboardSharing | null | undefined): string | null {
  if (sharing === null || sharing === undefined || sharing.others === 0) {
    return null;
  }

  const people = formatCount(sharing.others, "other person", "other people");

  return `This model is shared in ${sharing.workspaceName}. ${people} can open it now and will lose access. If you only want it to be private again, press Cancel and use Stop sharing in the Settings of the model.`;
}
