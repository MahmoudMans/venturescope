"use client";

import type { MouseEvent } from "react";

/**
 * The first keyboard stop on every page. It moves focus to the page's real
 * <main> landmark; "#main-content" remains as the no-JavaScript fallback.
 */
export function SkipToContent() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.querySelector<HTMLElement>("main");

    if (main === null) {
      return;
    }

    event.preventDefault();

    if (main.hasAttribute("tabindex") === false) {
      main.setAttribute("tabindex", "-1");
    }

    main.focus();

    main.scrollIntoView();
  }

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only z-[100] rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Skip to main content
    </a>
  );
}
