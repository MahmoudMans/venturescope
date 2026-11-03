"use client";

import { useEffect, useRef } from "react";

import { type FieldErrors, hasFieldErrors } from "@/lib/forms/field-errors";
import {
  type FieldSnapshot,
  restoreFormSnapshot,
  takeFormSnapshot,
} from "@/lib/forms/form-snapshot";

/**
 * Helps a person after a save that came back with messages. Put the returned `ref` on the form.
 * It puts back what the person typed, because React 19 clears the boxes after every save. Then it
 * moves the cursor to the first wrong box, so a screen reader says the box and its message.
 */
export function useFormErrorRecovery(errors: FieldErrors) {
  const ref = useRef<HTMLFormElement>(null);

  const typed = useRef<FieldSnapshot[]>([]);

  useEffect(() => {
    const form = ref.current;

    if (form === null) {
      return;
    }

    const remember = () => {
      typed.current = takeFormSnapshot(form);
    };

    form.addEventListener("submit", remember);

    return () => {
      form.removeEventListener("submit", remember);
    };
  }, []);

  useEffect(() => {
    if (hasFieldErrors(errors) === false) {
      return;
    }

    restoreFormSnapshot(typed.current);

    ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);

  return ref;
}
