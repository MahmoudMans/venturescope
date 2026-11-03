"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type CopyState = "idle" | "copied" | "failed";

/** Copies an absolute link built from a site-relative path such as /invite/abc. */
export function CopyLinkButton({ path, label = "Copy link" }: { path: string; label?: string }) {
  const [state, setState] = useState<CopyState>("idle");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  async function copy() {
    let next: CopyState = "copied";

    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
    } catch {
      next = "failed";
    }

    setState(next);

    if (timer.current !== null) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => setState("idle"), 3000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => {
          void copy();
        }}
      >
        {state === "copied" ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}

        {state === "copied" ? "Copied" : label}
      </Button>

      <span
        role="status"
        aria-live="polite"
        className={state === "failed" ? "text-sm text-destructive" : "sr-only"}
      >
        {state === "copied" ? "Link copied to the clipboard." : null}

        {state === "failed" ? "Copying failed. Select the link and copy it by hand." : null}
      </span>
    </div>
  );
}
