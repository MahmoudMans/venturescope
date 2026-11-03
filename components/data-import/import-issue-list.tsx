"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  describeIssueLimit,
  describeIssueToggle,
  issuesInView,
  MOST_ISSUES_SHOWN,
} from "@/lib/data-import/issue-list";
import type { DataImportIssue } from "@/lib/data-import/types";

/**
 * The problems that were found in a file. Below the width of a wide laptop each problem is a small
 * block with its row and field on one line and the whole message under them, so a message can be
 * read without moving a box sideways (a table of 650px showed only a quarter of it on a phone). The
 * blocks are part of the page and do not scroll in a box of their own, which is hard to use with a
 * finger. They show the first ten problems, and a button under them shows the others, because 50
 * blocks are about 3100px of page and the person would scroll past them to reach the preview. A
 * wide screen has the table, in a ScrollRegion, with every problem that is listed. Only one of the
 * two is shown at a time. The one that is hidden is also hidden from a screen reader and from the
 * Tab key, because it has `display: none`. The box around the ScrollRegion has that class, so the
 * ScrollRegion keeps the class names that all the tall tables of the app have.
 */
export function ImportIssueList({ issues }: { issues: DataImportIssue[] }) {
  const [expanded, setExpanded] = useState(false);

  const [seen, setSeen] = useState(issues);

  const buttonBox = useRef<HTMLDivElement>(null);

  const foldedByButton = useRef(false);

  // A new file has new issues. Its list starts short again, even if the last one was opened.
  if (seen !== issues) {
    setSeen(issues);

    setExpanded(false);
  }

  // The button is at the end of the list. When the list gets short, the page below it moves up, and
  // the person would be left far below it. The button is brought back into view.
  useEffect(() => {
    if (expanded === false && foldedByButton.current) {
      foldedByButton.current = false;

      buttonBox.current?.scrollIntoView({ block: "end" });
    }
  }, [expanded]);

  const shown = issues.slice(0, MOST_ISSUES_SHOWN);

  const inView = shown.slice(0, issuesInView(shown.length, expanded));

  const limit = describeIssueLimit(issues.length);

  const toggle = describeIssueToggle(shown.length, expanded);

  return (
    <section className="rounded-lg border">
      <div className="border-b p-4">
        <h3 className="font-semibold">Validation issues</h3>

        {limit === null ? null : (
          <p data-slot="import-issue-limit" className="mt-1 text-xs text-muted-foreground">
            {limit}
          </p>
        )}
      </div>

      <ul data-slot="import-issue-list" className="divide-y text-sm xl:hidden">
        {inView.map((issue, index) => (
          <li key={`${issue.row}:${issue.field}:${index}`} className="space-y-1 px-3 py-2">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium">Row {issue.row}</span>

              <span className="font-mono text-xs text-muted-foreground">{issue.field}</span>
            </p>

            <p className="break-words text-destructive">{issue.message}</p>
          </li>
        ))}
      </ul>

      {toggle === null ? null : (
        <div ref={buttonBox} data-slot="import-issue-toggle" className="border-t p-3 xl:hidden">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              foldedByButton.current = expanded;

              setExpanded(expanded === false);
            }}
          >
            <ChevronDown aria-hidden="true" className={expanded ? "rotate-180" : undefined} />

            {toggle}
          </Button>
        </div>
      )}

      <div data-slot="import-issue-table-box" className="hidden xl:block">
        <ScrollRegion label="Validation issues" className="max-h-72 overflow-y-auto">
          <table data-slot="import-issue-table" className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2 text-left">Row</th>

                <th className="px-3 py-2 text-left">Field</th>

                <th className="px-3 py-2 text-left">Issue</th>
              </tr>
            </thead>

            <tbody>
              {shown.map((issue, index) => (
                <tr key={`${issue.row}:${issue.field}:${index}`} className="border-b last:border-0">
                  <td className="px-3 py-2">{issue.row}</td>

                  <td className="px-3 py-2 font-mono text-xs">{issue.field}</td>

                  <td className="px-3 py-2 text-destructive">{issue.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </div>
    </section>
  );
}
