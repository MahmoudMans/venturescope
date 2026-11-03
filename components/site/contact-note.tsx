import { Mail } from "lucide-react";

import { cn } from "@/lib/utils";

/** Where to send a question. Shows the support address when the operator has set one. */
export function ContactNote({ email, className }: { email: string | null; className?: string }) {
  return (
    <p
      className={cn("flex items-start gap-2.5 text-sm leading-7 text-muted-foreground", className)}
    >
      <Mail className="mt-1.5 size-4 shrink-0" aria-hidden="true" />

      {email === null ? (
        <span>
          Questions? Ask the person or company that gave you access to this VentureScope service.
        </span>
      ) : (
        <span>
          Questions? Write to{" "}
          <a
            href={`mailto:${email}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {email}
          </a>
          .
        </span>
      )}
    </p>
  );
}
