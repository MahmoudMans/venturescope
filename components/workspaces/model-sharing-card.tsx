import { Lock, Share2, Users } from "lucide-react";
import Link from "next/link";

import {
  assignProjectToWorkspaceAction,
  removeProjectFromWorkspaceAction,
} from "@/app/(app)/workspaces/actions";
import { NativeSelect } from "@/components/forms/native-select";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/components/workspaces/confirm-action";
import type { ModelSharingView } from "@/lib/workspaces/model-sharing";

function StateRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Lock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
      <div
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{title}</p>

        <div className="space-y-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

/**
 * Who can open a model, for the person who owns it. They can share it with one of their
 * workspaces or take it back, without leaving the model.
 */
export function ModelSharingCard({
  projectId,
  projectName,
  sharing,
}: {
  projectId: string;
  projectName: string;
  sharing: ModelSharingView;
}) {
  return (
    <Card id="sharing" className="border-border/70">
      <CardHeader>
        <CardTitle>Sharing</CardTitle>

        <CardDescription>
          Choose who can open this model. You stay the only person who changes its inputs and its
          settings.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {sharing.kind === "shared" ? (
          <>
            <StateRow icon={Users} title={`Shared in ${sharing.workspaceName}`}>
              <p>{sharing.summary}</p>

              {sharing.canOpenWorkspace ? null : (
                <p>
                  You are not a collaborator of this workspace anymore. You can still stop sharing.
                </p>
              )}
            </StateRow>

            <div className="flex flex-wrap gap-2">
              {sharing.canOpenWorkspace ? (
                <Button asChild variant="outline">
                  <Link href={`/workspaces/${sharing.workspaceId}`}>Open workspace</Link>
                </Button>
              ) : null}

              <ConfirmAction
                action={removeProjectFromWorkspaceAction}
                fields={{ projectId, from: "settings" }}
                title="Stop sharing this model?"
                description={`${projectName} becomes private again. People in ${sharing.workspaceName} lose access to it, but the model itself is not deleted. You can share it again later.`}
                confirmLabel="Stop sharing"
                triggerVariant="outline"
                triggerSize="default"
              >
                Stop sharing
              </ConfirmAction>
            </div>
          </>
        ) : (
          <>
            <StateRow icon={Lock} title="Private">
              <p>Only you can open this model.</p>
            </StateRow>

            {sharing.targets.length > 0 ? (
              <form
                action={assignProjectToWorkspaceAction}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="projectId" value={projectId} />

                <input type="hidden" name="from" value="settings" />

                <div className="flex-1 space-y-2">
                  <Label htmlFor="share-workspace">Share with a workspace</Label>

                  <NativeSelect id="share-workspace" required name="workspaceId">
                    {sharing.targets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <SubmitButton variant="outline" size="lg" pendingLabel="Sharing...">
                  <Share2 className="size-4" aria-hidden="true" />
                  Share model
                </SubmitButton>
              </form>
            ) : (
              <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  You do not have a workspace where you can share models. Create one, or ask an
                  owner to make you an editor.
                </p>

                <Button asChild variant="outline">
                  <Link href="/workspaces">Open workspaces</Link>
                </Button>
              </div>
            )}
          </>
        )}

        <p className="text-xs leading-5 text-muted-foreground">
          Editors can work on actuals, scorecards, approvals and reviews. Viewers can only look.
        </p>
      </CardContent>
    </Card>
  );
}
