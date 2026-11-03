import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

export type ChecklistItem = {
  id: string;
  label: string;
  met: boolean;
};

/** Live list of password rules; each rule turns green and is announced as "(met)". */
export function PasswordChecklist({ id, checks }: { id: string; checks: ChecklistItem[] }) {
  return (
    <ul id={id} aria-label="Password requirements" className="grid gap-1 pt-1 text-xs">
      {checks.map((check) => (
        <li
          key={check.id}
          className={cn(
            "flex items-center gap-2",
            check.met ? "text-success" : "text-muted-foreground",
          )}
        >
          {check.met ? (
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Circle className="size-3.5 shrink-0" aria-hidden="true" />
          )}

          <span>{check.label}</span>

          <span className="sr-only">{check.met ? "(met)" : "(not met)"}</span>
        </li>
      ))}
    </ul>
  );
}
