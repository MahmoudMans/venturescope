import { LifeBuoy } from "lucide-react";
import Link from "next/link";

import { RecoveryAckForm } from "@/components/account/recovery-ack-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown on the dashboard until the person says that they saved their recovery key.
 * VentureScope sends no emails, so without the key a forgotten password cannot be reset.
 */
export function RecoveryReminderCard() {
  return (
    <Card
      aria-labelledby="recovery-reminder-title"
      className="border-warning/30 bg-warning/5 ring-warning/20 [--card-spacing:--spacing(5)]"
    >
      <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning/14 text-warning"
        >
          <LifeBuoy className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="recovery-reminder-title" className="text-base font-semibold">
            Save your recovery key
          </h2>

          <p className="text-sm leading-6 text-muted-foreground">
            VentureScope sends no emails. If you forget your password, the recovery key is the only
            way back into your account. Show it once and keep it in a password manager or on paper.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/account/security#recovery-key">Show my recovery key</Link>
          </Button>

          <RecoveryAckForm label="I already saved it" variant="ghost" />
        </div>
      </CardContent>
    </Card>
  );
}
