import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ScrollRegionProps = Omit<
  ComponentProps<"div">,
  "aria-label" | "aria-labelledby" | "role" | "tabIndex"
> & {
  /** What is inside, for example "Monthly variance". A screen reader says it when the box gets the focus. */
  label: string;
};

/**
 * A box that scrolls sideways when its content is wider than the page, such as a table with many
 * months. A box that scrolls with the mouse must also scroll with the keyboard, so this one can
 * get the focus: press Tab to reach it, then use the arrow keys. It has a name for screen readers.
 *
 * The focus line is a second box on top of the first one. A line on the scrolling box itself would
 * be hidden behind a fixed first column or a fixed header, and the cards around a table cut
 * everything that is outside of it. The second box does not take clicks and has no meaning for a
 * screen reader. The page around it passes `className` for the scrolling box, for example a height.
 */
export function ScrollRegion({ label, className, ...props }: ScrollRegionProps) {
  return (
    <div data-slot="scroll-region-frame" className="relative isolate">
      <div
        {...props}
        data-slot="scroll-region"
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn("peer overflow-x-auto overscroll-x-contain outline-none", className)}
      />

      <div
        aria-hidden="true"
        data-slot="scroll-region-focus"
        className="pointer-events-none absolute inset-0 z-30 opacity-0 outline-2 -outline-offset-2 outline-ring peer-focus-visible:opacity-100"
      />
    </div>
  );
}
