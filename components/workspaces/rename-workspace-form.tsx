import { renameWorkspaceAction } from "@/app/(app)/workspaces/manage-actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WORKSPACE_NAME_MAX, WORKSPACE_NAME_MIN } from "@/lib/workspaces/manage";

/**
 * The form that changes the name of a workspace. It is a server component: the
 * form posts straight to the server action, so it works without client code.
 */
export function RenameWorkspaceForm({
  workspaceId,
  currentName,
}: {
  workspaceId: string;
  currentName: string;
}) {
  return (
    <form action={renameWorkspaceAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div className="flex-1 space-y-2">
        <Label htmlFor="rename-workspace">Workspace name</Label>

        <Input
          id="rename-workspace"
          name="name"
          required
          minLength={WORKSPACE_NAME_MIN}
          maxLength={WORKSPACE_NAME_MAX}
          defaultValue={currentName}
          autoComplete="off"
          className="h-10"
        />
      </div>

      <SubmitButton size="lg" pendingLabel="Saving...">
        Save name
      </SubmitButton>
    </form>
  );
}
