export type WorkspaceNotice = {
  tone: "error" | "success" | "info";
  message: string;
};

/** "1 project", "2 projects". */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function workspaceRoleLabel(role: string): string {
  switch (role) {
    case "OWNER":
      return "Owner";

    case "EDITOR":
      return "Editor";

    default:
      return "Viewer";
  }
}

/** One sentence on what a role allows, shown on the invitation page. */
export function workspaceRoleDescription(role: string): string {
  switch (role) {
    case "OWNER":
      return "Owners manage collaborators and invitations, can take any model out of the workspace, can rename the workspace or give it to another collaborator, and can delete the workspace.";

    case "EDITOR":
      return "Editors can open the shared models and work on their actuals, scorecards, approvals and reviews. Only a model's owner changes its assumptions, financing and scenarios.";

    default:
      return "Viewers can open the models shared in this workspace but cannot change them.";
  }
}

/**
 * Messages for the "?status=" codes that the workspace actions attach
 * when they send a person back to a workspace page.
 */
const NOTICES: Record<string, WorkspaceNotice> = {
  "invalid-name": {
    tone: "error",
    message: "A workspace name needs 2 to 80 characters.",
  },

  "invalid-email": {
    tone: "error",
    message: "Enter a valid email address to invite someone.",
  },

  "self-invite": {
    tone: "error",
    message: "You cannot invite your own email address.",
  },

  "project-not-owned": {
    tone: "error",
    message:
      "You can only share your own models. Only the owner of a workspace can take another person's model out of it.",
  },

  "already-member": {
    tone: "error",
    message: "That person is already a collaborator. Change their role in the list instead.",
  },

  "invitation-missing": {
    tone: "error",
    message: "That invitation was not found. It may already be accepted or removed.",
  },

  "already-joined": {
    tone: "info",
    message: "You are already in this workspace.",
  },

  "not-a-member": {
    tone: "error",
    message: "You are not a collaborator of that workspace.",
  },

  "workspace-created": {
    tone: "success",
    message: "Workspace created. Invite collaborators or share a model to get started.",
  },

  joined: {
    tone: "success",
    message: "You joined the workspace.",
  },

  "role-updated": {
    tone: "success",
    message: "Role updated.",
  },

  "member-removed": {
    tone: "success",
    message: "Collaborator removed.",
  },

  "member-removed-with-models": {
    tone: "success",
    message:
      "Collaborator removed. The models they shared are private again, and none of them was deleted.",
  },

  "invitation-revoked": {
    tone: "success",
    message: "Invitation revoked.",
  },

  "project-shared": {
    tone: "success",
    message: "Model shared with this workspace.",
  },

  "project-removed": {
    tone: "success",
    message: "Model removed from the workspace.",
  },

  "project-removed-by-owner": {
    tone: "success",
    message:
      "Model removed from the workspace. It is private again for the person who owns it, and it was not deleted.",
  },

  "workspace-deleted": {
    tone: "success",
    message: "Workspace deleted. Its models went back to their owners.",
  },

  "workspace-left": {
    tone: "success",
    message: "You left the workspace. The models you shared there are private again.",
  },

  "workspace-renamed": {
    tone: "success",
    message: "Workspace renamed.",
  },

  "ownership-transferred": {
    tone: "success",
    message: "Ownership transferred. You are now an editor of this workspace.",
  },

  "not-owner": {
    tone: "error",
    message: "Only the owner of a workspace can do that.",
  },

  "transfer-no-member": {
    tone: "error",
    message: "Choose one of the collaborators of this workspace.",
  },

  "transfer-password": {
    tone: "error",
    message: "The password is not correct. Ownership was not changed.",
  },

  "transfer-rate-limit": {
    tone: "error",
    message: "Too many tries. Please wait a few minutes and try again.",
  },

  "transfer-changed": {
    tone: "error",
    message:
      "The workspace changed while you were working on it. Check the collaborators and try again.",
  },
};

export function getWorkspaceNotice(code: string | string[] | undefined): WorkspaceNotice | null {
  if (typeof code !== "string") {
    return null;
  }

  return Object.hasOwn(NOTICES, code) ? NOTICES[code] : null;
}

/** The invitation page is reached with "?status=invalid" when accepting fails. */
export function getInvitationNotice(code: string | string[] | undefined): WorkspaceNotice | null {
  if (code !== "invalid") {
    return null;
  }

  return {
    tone: "error",
    message:
      "This invitation could not be accepted. It may have expired, been revoked, or been issued to a different email address.",
  };
}

const EXPIRY_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

/** "Oct 23, 2026". Always UTC so the server and every browser agree. */
export function formatInvitationExpiry(date: Date): string {
  return EXPIRY_FORMAT.format(date);
}
