import { transferWorkspaceOwnershipAction } from "@/app/(app)/workspaces/manage-actions";
import { PasswordInput } from "@/components/auth/password-input";
import { NativeSelect } from "@/components/forms/native-select";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import type { TransferOption } from "@/lib/workspaces/manage";

/**
 * The form that gives a workspace to one of its collaborators. It is a server
 * component: the form posts straight to the server action. The password is the
 * check that the owner really wants this, because only the new owner can undo it.
 */
export function TransferOwnershipForm({
  workspaceId,
  options,
}: {
  workspaceId: string;
  options: TransferOption[];
}) {
  return (
    <form action={transferWorkspaceOwnershipAction} className="space-y-5">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div className="space-y-2">
        <Label htmlFor="transfer-member">New owner</Label>

        <NativeSelect id="transfer-member" name="memberId" required defaultValue="">
          <option value="" disabled>
            Choose a collaborator
          </option>

          {options.map((option) => (
            <option key={option.memberId} value={option.memberId}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-password">Your password</Label>

        <PasswordInput
          id="transfer-password"
          name="password"
          autoComplete="current-password"
          toggleLabel="Show password for the ownership transfer"
          describedBy="transfer-note"
        />
      </div>

      <p id="transfer-note" className="text-xs leading-5 text-muted-foreground">
        The new owner can invite and remove people, change roles, delete the workspace and give it
        to someone else. You stay in the workspace as an editor, and your own models stay yours.
        Only the new owner can give the workspace back to you.
      </p>

      <SubmitButton variant="destructive" size="lg" pendingLabel="Transferring...">
        Transfer ownership
      </SubmitButton>
    </form>
  );
}
