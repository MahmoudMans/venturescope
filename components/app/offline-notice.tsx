"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

/** How long the message "Back online" stays on the screen, in milliseconds. */
const BACK_ONLINE_MS = 4000;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);

  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);

    window.removeEventListener("offline", onChange);
  };
}

function isOnline(): boolean {
  return navigator.onLine;
}

/** The server cannot know. The page is drawn as online, and the browser corrects it. */
function isOnlineOnServer(): boolean {
  return true;
}

/**
 * Tells a person that the phone has no connection. A form that is sent without a connection fails
 * and the person does not know why. The notice sits at the bottom of the screen, above the
 * windows of the app, and it never takes a tap (pointer-events-none). A screen reader says the
 * message because the box is a polite live region that exists before the message appears.
 */
export function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, isOnline, isOnlineOnServer);

  const [lastOnline, setLastOnline] = useState(true);

  const [backOnline, setBackOnline] = useState(false);

  // A change of the connection is handled while drawing, so no effect has to set state at once.
  if (online !== lastOnline) {
    setLastOnline(online);

    setBackOnline(online);
  }

  useEffect(() => {
    if (backOnline === false) {
      return undefined;
    }

    const timer = window.setTimeout(() => setBackOnline(false), BACK_ONLINE_MS);

    return () => window.clearTimeout(timer);
  }, [backOnline]);

  return (
    <div
      data-slot="offline-notice"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex justify-center sm:inset-x-4 print:hidden"
    >
      {online === false ? (
        <div
          data-state="offline"
          className="flex w-full max-w-md items-start gap-3 rounded-lg border border-warning/40 bg-background px-4 py-3 text-sm text-foreground shadow-lg"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />

          <div className="min-w-0 space-y-0.5">
            <div className="font-medium">You are offline</div>

            <div className="text-muted-foreground">
              You can keep reading this page. Changes cannot be saved until you are back online.
            </div>
          </div>
        </div>
      ) : backOnline ? (
        <div
          data-state="online"
          className="flex w-full max-w-md items-center gap-3 rounded-lg border border-success/40 bg-background px-4 py-3 text-sm text-foreground shadow-lg"
        >
          <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />

          <div className="font-medium">Back online</div>
        </div>
      ) : null}
    </div>
  );
}
