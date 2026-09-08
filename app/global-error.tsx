"use client";

import {
  useEffect,
} from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error:
    Error & {
      digest?:
        string;
    };

  reset:
    () => void;
}) {
  useEffect(
    () => {
      console.error(
        "VentureScope global application error",
        {
          digest:
            error.digest ??
            null,
        },
      );
    },
    [
      error.digest,
    ],
  );

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
            <div className="text-sm font-semibold text-muted-foreground">
              VENTURESCOPE
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Something went wrong
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              VentureScope could not complete this request. No internal error details are exposed in the interface.
            </p>

            {error.digest ? (
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                Reference: {
                  error.digest
                }
              </p>
            ) : null}

            <button
              type="button"
              onClick={
                reset
              }
              className="mt-6 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
