import { CircleAlert, CircleCheck, Info, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  describeCheckupSummary,
  type CheckupItem,
  type CheckupTone,
} from "@/lib/account/security-checkup";
import { cn } from "@/lib/utils";

const TONES: Record<CheckupTone, { icon: LucideIcon; label: string; className: string }> = {
  good: {
    icon: CircleCheck,
    label: "Done",
    className: "bg-success/12 text-success dark:bg-success/20",
  },

  attention: {
    icon: CircleAlert,
    label: "Needs your attention",
    className: "bg-warning/14 text-warning dark:bg-warning/20",
  },

  info: {
    icon: Info,
    label: "Good to know",
    className: "bg-info/12 text-info dark:bg-info/20",
  },
};

/** A short list of plain facts about the account, at the top of the Security page. */
export function SecurityCheckupCard({ items }: { items: CheckupItem[] }) {
  const summary = describeCheckupSummary(items);

  return (
    <Card
      id="checkup"
      aria-labelledby="security-checkup-title"
      className="[--card-spacing:--spacing(6)]"
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
            >
              <ShieldCheck className="size-5" />
            </div>

            <div className="space-y-1">
              <h2
                id="security-checkup-title"
                className="font-heading text-lg font-medium leading-snug"
              >
                Security check-up
              </h2>

              <CardDescription>A quick look at how well your account is protected.</CardDescription>
            </div>
          </div>

          <Badge variant={summary.tone}>{summary.label}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="divide-y rounded-xl border">
          {items.map((item) => {
            const tone = TONES[item.tone];

            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      tone.className,
                    )}
                  >
                    <tone.icon className="size-4" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-medium">
                      {item.title}
                      <span className="sr-only"> ({tone.label})</span>
                    </h3>

                    <p className="break-words text-sm leading-6 text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>

                {item.action ? (
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={item.action.href}>{item.action.label}</Link>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
