/** The most issues that the screen lists. The count above the list always shows all of them. */
export const MOST_ISSUES_SHOWN = 50;

/** How many issues the list on a phone shows before the person asks for the others. */
export const FIRST_ISSUES_SHOWN = 10;

/**
 * The fewest issues that the button may hide. A button that hides one or two issues costs a tap and
 * saves nothing, so a list shorter than the first issues plus this many is shown whole.
 */
export const FEWEST_ISSUES_HIDDEN = 3;

/**
 * Tells that the list of issues is cut, or gives null when every issue is in the list. A person who
 * fixes the first 50 and does not know that more are hidden would think the file is clean. The words
 * do not say "showing", because on a phone the list may show only the first ten of the 50 that it
 * holds, and the button under it tells that.
 */
export function describeIssueLimit(total: number): string | null {
  if (total <= MOST_ISSUES_SHOWN) {
    return null;
  }

  return `Only the first ${MOST_ISSUES_SHOWN} of ${total} issues are listed. Fix these, then choose the file again to see the others.`;
}

/** True when the list on a phone is long enough to hide some of its issues behind a button. */
function isFolded(listed: number): boolean {
  return listed >= FIRST_ISSUES_SHOWN + FEWEST_ISSUES_HIDDEN;
}

/**
 * How many of the listed issues the list on a phone shows. It is all of them when the person asked
 * for them, or when there are too few to be worth a button.
 */
export function issuesInView(listed: number, expanded: boolean): number {
  if (isFolded(listed) && expanded === false) {
    return FIRST_ISSUES_SHOWN;
  }

  return listed;
}

/** The words on the button under the list on a phone, or null when the list has no button. */
export function describeIssueToggle(listed: number, expanded: boolean): string | null {
  if (isFolded(listed) === false) {
    return null;
  }

  if (expanded) {
    return "Show fewer issues";
  }

  return `Show ${listed - FIRST_ISSUES_SHOWN} more issues`;
}
