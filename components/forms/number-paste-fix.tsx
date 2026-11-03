"use client";

import { useEffect } from "react";

import { installNumberPaste } from "@/lib/forms/paste-number";

/**
 * Draws nothing. It makes the paste of a number from a spreadsheet work in every number box of the
 * app: "1 250,50" becomes 1250.50 and "(1,200)" becomes -1200, and not 125050 and 1200. It is
 * drawn once, in the root layout.
 */
export function NumberPasteFix() {
  useEffect(() => installNumberPaste(), []);

  return null;
}
