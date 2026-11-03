"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import { installLeaveGuard, markUnsaved } from "@/lib/forms/leave-guard";
import { type UnsavedTracker, trackUnsavedChanges } from "@/lib/forms/unsaved-changes";

/**
 * Protects the work of a person who edits a form. It returns true while the form has changes that
 * are not saved, so the page can say so. In that time a click on a link, the search bar, closing
 * the tab and reloading the page all ask first. Ctrl+S (Cmd+S) in the form saves it.
 *
 * Put the ref of the form in `formRef`. Give `savedAt` a new value each time a save worked (the
 * action state is a good choice) and `null` at all other times. The form is then clean again.
 */
export function useUnsavedChangesWarning(
  formRef: RefObject<HTMLFormElement | null>,
  savedAt: unknown,
): boolean {
  const [dirty, setDirty] = useState(false);

  const tracker = useRef<UnsavedTracker | null>(null);

  const owner = useRef({});

  useEffect(() => {
    const form = formRef.current;

    if (form === null) {
      return;
    }

    const key = owner.current;

    const release = installLeaveGuard();

    const started = trackUnsavedChanges(form, {
      onChange: (next) => {
        markUnsaved(key, next);

        setDirty(next);
      },
    });

    tracker.current = started;

    return () => {
      started.stop();

      tracker.current = null;

      markUnsaved(key, false);

      release();
    };
  }, [formRef]);

  useEffect(() => {
    if (savedAt === null || savedAt === undefined) {
      return;
    }

    // React sets the boxes to the saved values when the save ends. The saved state is taken after
    // that, and once more later in case the new values from the server come a little after.
    const now = setTimeout(() => tracker.current?.markSaved(), 0);

    const later = setTimeout(() => {
      if (tracker.current?.isDirty() === false) {
        tracker.current.markSaved();
      }
    }, 500);

    return () => {
      clearTimeout(now);

      clearTimeout(later);
    };
  }, [savedAt]);

  return dirty;
}
