import { LayoutDashboard, Link2, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { INVITATION_DAYS } from "@/lib/workspaces/invitation-state";

/**
 * Shown when an invitation link cannot be used. The page gives the same answer for every reason,
 * so it does not tell a stranger whether a link was used, expired or replaced.
 */
export default function InvitationNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-5 py-12">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm"
          >
            <Link2 className="size-5" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Workspace invitation
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            This invitation link does not work
          </h1>

          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Nothing is wrong with your account. The link may have one of these problems:
          </p>

          <ul className="max-w-md space-y-1.5 text-left text-sm leading-6 text-muted-foreground">
            <li>It is older than {INVITATION_DAYS} days.</li>

            <li>It was already used.</li>

            <li>The workspace owner made a newer link for the same email address.</li>

            <li>The workspace owner cancelled it.</li>
          </ul>

          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Ask the workspace owner to send you a new link.
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Go to dashboard
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link href="/workspaces">
                <Users className="size-4" aria-hidden="true" />
                Open workspaces
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
