import { changeEmailAction } from "@/app/(app)/account/security/email-action";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_MAX_LENGTH } from "@/lib/account/email-change";

/**
 * The form to change the sign-in email address. It is a server component: the
 * form posts straight to the server action, so it works without client code.
 */
export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  return (
    <form action={changeEmailAction} className="space-y-5">
      {currentEmail === "" ? null : (
        <p className="text-sm leading-6 text-muted-foreground">
          Your email address now is{" "}
          <span className="break-all font-medium text-foreground">{currentEmail}</span>.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="newEmail">New email address</Label>

        <Input
          id="newEmail"
          name="newEmail"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={EMAIL_MAX_LENGTH}
          className="h-10"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmEmail">Confirm new email address</Label>

        <Input
          id="confirmEmail"
          name="confirmEmail"
          type="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={EMAIL_MAX_LENGTH}
          className="h-10"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailPassword">Current password</Label>

        <PasswordInput
          id="emailPassword"
          name="password"
          autoComplete="current-password"
          toggleLabel="Show password for the email change"
          describedBy="email-change-note"
        />
      </div>

      <p id="email-change-note" className="text-xs leading-5 text-muted-foreground">
        VentureScope sends no emails, so the new address is not checked by a message. Type it
        carefully. Changing it signs you out everywhere, including this browser, and you sign in
        again with the new address.
      </p>

      <SubmitButton size="lg" pendingLabel="Changing email...">
        Change email address
      </SubmitButton>
    </form>
  );
}
