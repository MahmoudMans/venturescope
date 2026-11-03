import type { SharedProjectAccess } from "@/lib/workspaces/shared-role";

export type SharedAccessNotice = {
  title: string;

  message: string;
};

/**
 * What a person who does not own a model may do in it. The model inputs
 * (assumptions, revenue, expenses, financing, scenarios, settings) always stay
 * with the owner; editors can work on the review pages.
 */
export function describeSharedAccess(
  access: Pick<SharedProjectAccess, "role" | "ownerName" | "workspaceName">,
): SharedAccessNotice {
  switch (access.role) {
    case "OWNER":
      return {
        title: "Workspace owner access",

        message: `This model belongs to ${access.ownerName}. You can review it as owner of ${access.workspaceName}, but only ${access.ownerName} can change its inputs.`,
      };

    case "EDITOR":
      return {
        title: "Editor access",

        message: `You can work on actuals, scorecards, approvals and reviews. Only ${access.ownerName} can change the model inputs: assumptions, revenue, expenses, financing, scenarios and settings.`,
      };

    case "VIEWER":
      return {
        title: "View-only access",

        message: `${access.ownerName} shared this model in ${access.workspaceName}. You can open every page, but you cannot change anything.`,
      };
  }
}
