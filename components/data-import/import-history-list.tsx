"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  describeAttemptCounts,
  describeAttemptTime,
  describeAttemptToggle,
  describeAttemptUser,
  describeImportStatus,
  describeImportType,
  importStatusTone,
  isAttemptFolded,
} from "@/lib/data-import/history-list";
import type { DataImportBatchView } from "@/lib/data-import/types";

/**
 * The attempts of the import history, newest first. Each attempt is a small block with the name of
 * the file and its status on top, then the kind, the time, the person and the four counts, and last
 * the error if there is one. The table that was here was 1200px wide and could not fit in the page
 * on any screen, because the page is 1216px wide at most, so a block is used on every screen. It
 * sets its own layout by its own width (a container query): a grid on a phone, and one wrapping line
 * when the block is 576px wide or more. A phone or a tablet shows the first few attempts and a
 * button under them shows the others, because a hundred blocks are a very long page. From 1280px
 * every attempt is shown, as the table did, and the button is gone.
 */
export function ImportHistoryList({ history }: { history: DataImportBatchView[] }) {
  const [expanded, setExpanded] = useState(false);

  const [seen, setSeen] = useState(history);

  const buttonBox = useRef<HTMLDivElement>(null);

  const foldedByButton = useRef(false);

  // A new list has new attempts, for example after an import. It starts short again.
  if (seen !== history) {
    setSeen(history);

    setExpanded(false);
  }

  // The button is at the end of the blocks. When they get short, the page below them moves up, and
  // the person would be left far below them. The button is brought back into view.
  useEffect(() => {
    if (expanded === false && foldedByButton.current) {
      foldedByButton.current = false;

      buttonBox.current?.scrollIntoView({ block: "end" });
    }
  }, [expanded]);

  const toggle = describeAttemptToggle(history.length, expanded);

  return (
    <>
      <ul data-slot="import-history-list">
        {history.map((batch, index) => (
          <li
            key={batch.id}
            data-slot="import-history-item"
            className={
              isAttemptFolded(index, history.length, expanded)
                ? "@container space-y-2 border-t px-4 py-3 first:border-t-0 max-xl:hidden"
                : "@container space-y-2 border-t px-4 py-3 first:border-t-0"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 break-words text-sm font-medium">{batch.fileName}</p>

              <p className={`shrink-0 text-xs font-semibold ${importStatusTone(batch.status)}`}>
                {describeImportStatus(batch.status)}
              </p>
            </div>

            <dl className="grid grid-cols-4 gap-x-3 gap-y-2 text-xs @xl:flex @xl:flex-wrap @xl:gap-x-6">
              <div className="col-span-2 min-w-0">
                <dt className="text-muted-foreground">Type</dt>

                <dd className="break-words">{describeImportType(batch.importType)}</dd>
              </div>

              <div className="col-span-2 min-w-0">
                <dt className="text-muted-foreground">Time</dt>

                <dd className="break-words">{describeAttemptTime(batch.createdAt)}</dd>
              </div>

              <div className="col-span-4 min-w-0">
                <dt className="text-muted-foreground">User</dt>

                <dd className="break-words">{describeAttemptUser(batch.createdBy)}</dd>
              </div>

              {describeAttemptCounts(batch).map((count) => (
                <div key={count.label} className="min-w-0">
                  <dt className="break-words text-muted-foreground">{count.label}</dt>

                  <dd className="tabular-nums">{count.value}</dd>
                </div>
              ))}
            </dl>

            {batch.errorSummary === null ? null : (
              <p className="break-words rounded-md bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Error: </span>

                {batch.errorSummary}
              </p>
            )}
          </li>
        ))}
      </ul>

      {toggle === null ? null : (
        <div ref={buttonBox} data-slot="import-history-toggle" className="border-t p-3 xl:hidden">
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
    </>
  );
}
