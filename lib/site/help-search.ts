import type { GlossaryTerm, HelpGroup } from "@/lib/site/help-content";

/** Splits what the person typed into lower-case words. */
export function searchWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/** True when every word appears somewhere in the text. */
export function matchesWords(text: string, words: readonly string[]): boolean {
  const haystack = text.toLowerCase();

  return words.every((word) => haystack.includes(word));
}

/**
 * Keeps the answers that match the search. The title of a group counts too,
 * so searching for "account" shows every answer in "Account and security".
 * An empty search returns the groups unchanged.
 */
export function filterHelpGroups(groups: readonly HelpGroup[], query: string): HelpGroup[] {
  const words = searchWords(query);

  if (words.length === 0) {
    return [...groups];
  }

  const result: HelpGroup[] = [];

  for (const group of groups) {
    const items = group.items.filter((item) =>
      matchesWords(`${group.title} ${item.question} ${item.answer.join(" ")}`, words),
    );

    if (items.length > 0) {
      result.push({ ...group, items });
    }
  }

  return result;
}

export function filterGlossary(terms: readonly GlossaryTerm[], query: string): GlossaryTerm[] {
  const words = searchWords(query);

  if (words.length === 0) {
    return [...terms];
  }

  return terms.filter((entry) => matchesWords(`${entry.term} ${entry.meaning}`, words));
}

export function countHelpItems(groups: readonly HelpGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
}
