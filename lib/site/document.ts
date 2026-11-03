/** One part of a long page such as the Privacy notice or the Terms. */
export type DocumentSection = {
  /** Used for the link in the table of contents, for example "cookies-and-storage". */
  id: string;

  title: string;

  paragraphs?: string[];

  bullets?: string[];
};

/** All the words of a document in one string. Used by the tests and the search. */
export function documentText(sections: readonly DocumentSection[]): string {
  return sections
    .map((section) =>
      [section.title, ...(section.paragraphs ?? []), ...(section.bullets ?? [])].join(" "),
    )
    .join(" ");
}
