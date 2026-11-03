"use client";

import { FileUp } from "lucide-react";
import { useActionState, useState } from "react";

import { importModelAction } from "@/app/(app)/projects/import-action";
import { StatusNotice } from "@/components/app/status-notice";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BACKUP_TOO_LARGE_MESSAGE,
  MAX_BACKUP_BYTES,
  initialImportModelState,
} from "@/lib/projects/backup-limits";

/**
 * Restores a model from a backup file. The file is checked in the browser for
 * its size only; everything else is checked on the server before saving.
 */
export function ImportModelForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(importModelAction, initialImportModelState);

  const [tooLarge, setTooLarge] = useState(false);

  const message = tooLarge ? BACKUP_TOO_LARGE_MESSAGE : state.message;

  return (
    <form action={formAction} className={className}>
      <div className="space-y-2">
        <Label htmlFor="backup-file">Backup file</Label>

        <Input
          id="backup-file"
          name="backup"
          type="file"
          accept="application/json,.json"
          required
          aria-describedby={message ? "backup-file-message" : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];

            setTooLarge(file !== undefined && file.size > MAX_BACKUP_BYTES);
          }}
        />
      </div>

      {message ? (
        <div id="backup-file-message" className="mt-3">
          <StatusNotice tone="error">{message}</StatusNotice>
        </div>
      ) : null}

      <SubmitButton
        variant="outline"
        className="mt-3"
        disabled={tooLarge}
        pendingLabel="Restoring..."
      >
        <FileUp className="size-4" aria-hidden="true" />
        Restore model
      </SubmitButton>
    </form>
  );
}
