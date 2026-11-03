import { formatCount } from "@/lib/workspaces/labels";
import { ownerDisplayName } from "@/lib/workspaces/shared-role";

/** A workspace where a person may put a model: one they own, or one where they are an editor. */
export type ShareTarget = {
  id: string;

  name: string;
};

/** One entry per workspace, sorted by name, so the list in the form never changes order. */
export function buildShareTargets(workspaces: ReadonlyArray<ShareTarget>): ShareTarget[] {
  const seen = new Set<string>();

  const targets: ShareTarget[] = [];

  for (const workspace of workspaces) {
    if (seen.has(workspace.id) === false) {
      seen.add(workspace.id);

      targets.push({ id: workspace.id, name: workspace.name });
    }
  }

  return targets.sort(
    (left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
      left.id.localeCompare(right.id),
  );
}

/** The workspace that a model is shared in, as the person who looks at it can see it. */
export type SharedWorkspaceInput = {
  id: string;

  name: string;

  /** Collaborators in the list, not counting the owner of the workspace. */
  memberCount: number;

  /** True when the person owns the workspace or is one of its collaborators. */
  personIsInside: boolean;
};

export type ModelSharingView =
  | {
      kind: "private";

      targets: ShareTarget[];
    }
  | {
      kind: "shared";

      workspaceId: string;

      workspaceName: string;

      /** How many other people can open the model besides its owner. */
      others: number;

      summary: string;

      /** False when the owner of the model no longer belongs to that workspace. */
      canOpenWorkspace: boolean;
    };

/** How many people besides the owner of the model can open it. */
export function countOtherPeople(workspace: SharedWorkspaceInput): number {
  // The owner of the workspace and every collaborator can open it. The owner of the
  // model is one of them, unless they left the workspace, so they are not counted twice.
  return workspace.personIsInside ? workspace.memberCount : workspace.memberCount + 1;
}

/** One sentence about who can open a shared model. */
export function describeOthers(others: number): string {
  if (others === 0) {
    return "Nobody else has joined this workspace, so only you can open this model.";
  }

  return `${formatCount(others, "other person", "other people")} can open this model.`;
}

export function describeModelSharing(input: {
  workspace: SharedWorkspaceInput | null;

  targets: ReadonlyArray<ShareTarget>;
}): ModelSharingView {
  if (input.workspace === null) {
    return { kind: "private", targets: buildShareTargets(input.targets) };
  }

  const others = countOtherPeople(input.workspace);

  return {
    kind: "shared",

    workspaceId: input.workspace.id,

    workspaceName: input.workspace.name,

    others,

    summary: describeOthers(others),

    canOpenWorkspace: input.workspace.personIsInside,
  };
}

/** The value for the "Project ownership" row on the Settings page. */
export function describeOwnership(input: {
  isOwner: boolean;

  workspaceName: string | null;

  ownerName: string | null | undefined;
}): string {
  if (input.isOwner) {
    return input.workspaceName === null
      ? "Private to you"
      : `Yours, shared in ${input.workspaceName}`;
  }

  const owner = `Owned by ${ownerDisplayName(input.ownerName)}`;

  return input.workspaceName === null ? owner : `${owner}, shared in ${input.workspaceName}`;
}

/** Shown on the Settings page to a person who cannot change the settings. */
export function settingsOwnerMessage(ownerName: string | null | undefined): string {
  return `${ownerDisplayName(ownerName)} owns this model and is the only person who can change these settings.`;
}

/**
 * Where a person goes after a model was shared or taken out of a workspace. A form on the
 * Settings page of the model sends the person back there. Every other form goes to the
 * workspace. Only a fixed path is built, never an address that someone typed.
 */
export function sharingReturnPath(input: {
  from: string;

  isModelOwner: boolean;

  projectId: string;

  workspaceId: string | null;

  status: string;
}): string {
  if (input.from === "settings" && input.isModelOwner) {
    return `/projects/${input.projectId}/settings?status=${input.status}`;
  }

  return input.workspaceId === null
    ? `/workspaces?status=${input.status}`
    : `/workspaces/${input.workspaceId}?status=${input.status}`;
}
