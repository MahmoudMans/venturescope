"use client";

import { useState } from "react";

import { deleteAccountAction } from "@/app/(app)/account/security/actions";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");

  return (
    <form action={deleteAccountAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="deletePassword">Current password</Label>

        <PasswordInput
          id="deletePassword"
          name="password"
          autoComplete="current-password"
          toggleLabel="Show password for deletion"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deleteConfirmation">Type {CONFIRMATION_PHRASE}</Label>

        <Input
          id="deleteConfirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          className="h-10"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />
      </div>

      <SubmitButton
        variant="destructive"
        size="lg"
        pendingLabel="Deleting account..."
        disabled={confirmation !== CONFIRMATION_PHRASE}
      >
        Permanently delete account
      </SubmitButton>
    </form>
  );
}
