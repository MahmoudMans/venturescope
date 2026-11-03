/**
 * The name to show for a person. The saved name wins because the session keeps
 * the name from sign-in time, so it is out of date after a rename.
 */
export function pickDisplayName(
  savedName: string | null | undefined,
  sessionName: string | null | undefined,
): string {
  return savedName?.trim() || sessionName?.trim() || "";
}

/** "Ada Lovelace" becomes "Ada"; an empty name stays empty. */
export function firstNameOf(displayName: string): string {
  const [first = ""] = displayName.trim().split(/\s+/);

  return first;
}
