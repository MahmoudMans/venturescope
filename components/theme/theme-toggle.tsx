"use client";

import {
  Moon,
  Sun,
} from "lucide-react";
import {
  useTheme,
} from "next-themes";
import {
  useSyncExternalStore,
} from "react";

import {
  Button,
} from "@/components/ui/button";

function subscribeToHydration() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const {
    resolvedTheme,
    setTheme,
  } =
    useTheme();

  const mounted =
    useSyncExternalStore(
      subscribeToHydration,
      getClientSnapshot,
      getServerSnapshot,
    );

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        aria-label="Theme control loading"
      >
        <Sun
          className="size-4"
          aria-hidden="true"
        />
      </Button>
    );
  }

  const dark =
    resolvedTheme ===
    "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() =>
        setTheme(
          dark
            ? "light"
            : "dark",
        )
      }
      aria-label={
        dark
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
    >
      {dark ? (
        <Sun
          className="size-4"
          aria-hidden="true"
        />
      ) : (
        <Moon
          className="size-4"
          aria-hidden="true"
        />
      )}
    </Button>
  );
}
