"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ContactNote } from "@/components/site/contact-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GlossaryTerm, HelpGroup } from "@/lib/site/help-content";
import { countHelpItems, filterGlossary, filterHelpGroups } from "@/lib/site/help-search";
import { PUBLIC_INFO_LINKS } from "@/lib/site/public-pages";

function statusText(query: string, answers: number, terms: number, topics: number): string {
  if (query === "") {
    return `${answers} answers in ${topics} topics, plus a short glossary.`;
  }

  if (answers === 0 && terms === 0) {
    return "Nothing matches your search.";
  }

  const parts: string[] = [];

  if (answers > 0) {
    parts.push(`${answers} ${answers === 1 ? "answer" : "answers"}`);
  }

  if (terms > 0) {
    parts.push(`${terms} glossary ${terms === 1 ? "term" : "terms"}`);
  }

  return `Found ${parts.join(" and ")}.`;
}

export function HelpCenter({
  groups,
  glossary,
  supportEmail,
}: {
  groups: HelpGroup[];
  glossary: GlossaryTerm[];
  supportEmail: string | null;
}) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();

  const shownGroups = filterHelpGroups(groups, query);

  const shownTerms = filterGlossary(glossary, query);

  const answerCount = countHelpItems(shownGroups);

  const nothingFound = trimmed !== "" && answerCount === 0 && shownTerms.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 lg:py-20">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Help center
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">How can we help?</h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Short answers about building a forecast, reading the numbers, working with a team and
          keeping your account safe.
        </p>

        <div className="relative mt-8">
          <label htmlFor="help-search" className="sr-only">
            Search the help center
          </label>

          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <Input
            id="help-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search, for example runway or recovery key"
            autoComplete="off"
            className="h-11 pl-10"
          />
        </div>

        <p aria-live="polite" className="mt-3 min-h-5 text-sm text-muted-foreground">
          {statusText(trimmed, answerCount, shownTerms.length, shownGroups.length)}
        </p>
      </header>

      {trimmed === "" ? (
        <nav aria-label="Topics" className="mt-6 flex flex-wrap gap-2">
          {groups.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="touch-target inline-flex items-center rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {group.title}
            </a>
          ))}

          <a
            href="#glossary"
            className="touch-target inline-flex items-center rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Glossary
          </a>
        </nav>
      ) : null}

      {nothingFound ? (
        <div className="mt-10 rounded-xl border border-dashed p-6 text-center">
          <p className="font-medium">No answers match your search</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Try a shorter word, or clear the search to see every topic.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setQuery("")}
          >
            Clear search
          </Button>
        </div>
      ) : null}

      <div className="mt-10 space-y-12">
        {shownGroups.map((group) => (
          <section
            key={group.id}
            id={group.id}
            aria-labelledby={`${group.id}-title`}
          >
            <h2 id={`${group.id}-title`} className="text-2xl font-semibold tracking-tight">
              {group.title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">{group.summary}</p>

            <div className="mt-5 space-y-3">
              {group.items.map((item) => (
                <details
                  key={item.id}
                  id={item.id}
                  open={trimmed === "" ? undefined : true}
                  className="group rounded-xl border bg-card"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3.5 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    {item.question}

                    <ChevronDown
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>

                  <div className="space-y-3 px-4 pb-4 text-sm leading-7 text-muted-foreground">
                    {item.answer.map((paragraph, index) => (
                      <p key={`${item.id}-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        {shownTerms.length > 0 ? (
          <section id="glossary" aria-labelledby="glossary-title">
            <h2 id="glossary-title" className="text-2xl font-semibold tracking-tight">
              Glossary
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              The words you will meet most often.
            </p>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {shownTerms.map((entry) => (
                <div key={entry.term} className="rounded-xl border bg-card p-4">
                  <dt className="font-medium">{entry.term}</dt>

                  <dd className="mt-1 text-sm leading-6 text-muted-foreground">{entry.meaning}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>

      <section className="mt-14 rounded-2xl border bg-muted/40 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Still need help?</h2>

        <ContactNote email={supportEmail} className="mt-2" />

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {PUBLIC_INFO_LINKS.filter((link) => link.href !== "/help").map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="touch-target inline-flex items-center font-medium text-foreground underline-offset-4 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
