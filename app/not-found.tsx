import {
  ArrowLeft,
  SearchX,
} from "lucide-react";
import Link from "next/link";

import {
  Button,
} from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
          <SearchX
            className="size-5"
            aria-hidden="true"
          />
        </div>

        <div className="mt-6 text-sm font-semibold text-muted-foreground">
          404
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Resource not found
        </h1>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This resource does not exist or is not available to your account.
        </p>

        <Button
          asChild
          variant="outline"
          className="mt-6"
        >
          <Link href="/">
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />

            Return home
          </Link>
        </Button>
      </div>
    </main>
  );
}
