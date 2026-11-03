import { formatInvitationExpiry } from "@/lib/workspaces/labels";

/**
 * True when a person may take a model out of a workspace: the person who
 * owns the model, or the owner of the workspace. Taking a model out never
 * deletes it. It becomes private again for the person who owns it.
 */
export function canUnshareModel(input: {
  userId: string;

  modelOwnerId: string;

  workspaceOwnerId: string;
}): boolean {
  return input.userId === input.modelOwnerId || input.userId === input.workspaceOwnerId;
}

/** "Shared by Karim" for a model that another person put in the workspace. */
export function sharedByLabel(user: { name: string | null; email: string }): string {
  const name = user.name?.trim() ?? "";

  return `Shared by ${name === "" ? user.email : name}`;
}

/** "Joined Oct 17, 2026". The date is always in UTC, so every screen shows the same day. */
export function joinedLabel(date: Date): string {
  return `Joined ${formatInvitationExpiry(date)}`;
}

/** The notice code after the owner removed a collaborator. */
export function memberRemovedStatus(
  releasedModels: number,
): "member-removed" | "member-removed-with-models" {
  return releasedModels > 0 ? "member-removed-with-models" : "member-removed";
}

/** The notice code after a model was taken out of a workspace. */
export function projectRemovedStatus(
  userId: string,
  modelOwnerId: string,
): "project-removed" | "project-removed-by-owner" {
  return userId === modelOwnerId ? "project-removed" : "project-removed-by-owner";
}
