import {
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

import { VentureScopeLogo } from "@/components/brand/venturescope-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-5 text-center">
      <VentureScopeLogo />

      <div className="mt-10 text-sm font-medium text-muted-foreground">
        404
      </div>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        This page does not exist.
      </h1>

      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        The VentureScope resource you requested could not be found.
      </p>

      <Button
        asChild
        className="mt-7"
      >
        <Link href="/">
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />

          Return home
        </Link>
      </Button>
    </main>
  );
}
