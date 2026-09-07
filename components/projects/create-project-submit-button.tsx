"use client";

import {
  LoaderCircle,
} from "lucide-react";
import {
  useFormStatus,
} from "react-dom";

import { Button } from "@/components/ui/button";

export function CreateProjectSubmitButton() {
  const {
    pending,
  } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      size="lg"
    >
      {pending ? (
        <>
          <LoaderCircle
            className="size-4 animate-spin"
            aria-hidden="true"
          />

          Creating model...
        </>
      ) : (
        "Create financial model"
      )}
    </Button>
  );
}
