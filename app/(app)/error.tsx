"use client";

import {
  CircleAlert,
  RotateCcw,
} from "lucide-react";
import {
  useEffect,
} from "react";

import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WorkspaceError({
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
        "VentureScope workspace error",
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
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <CircleAlert
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <CardTitle className="mt-4">
            We could not load this workspace
          </CardTitle>

          <CardDescription className="max-w-2xl leading-6">
            The request failed safely. VentureScope does not expose database, authentication, stack-trace or internal service details here.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error.digest ? (
            <p className="mb-5 font-mono text-xs text-muted-foreground">
              Reference: {
                error.digest
              }
            </p>
          ) : null}

          <Button
            type="button"
            onClick={
              reset
            }
          >
            <RotateCcw
              className="size-4"
              aria-hidden="true"
            />

            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
