"use client";

import {
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  useEffect,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const {
    resolvedTheme,
    setTheme,
  } = useTheme();

  const [
    mounted,
    setMounted,
  ] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Change color theme"
        disabled
      >
        <Sun
          className="size-4"
          aria-hidden="true"
        />
      </Button>
    );
  }

  const dark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={
        dark
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      onClick={() => {
        setTheme(
          dark
            ? "light"
            : "dark",
        );
      }}
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
