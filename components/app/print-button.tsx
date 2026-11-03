"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Opens the print window of the browser. There, a person can choose a printer or "Save as PDF".
 * The button itself is never printed.
 */
export function PrintButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("print:hidden", className)}
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden="true" />
      Print
    </Button>
  );
}
