"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  describePreviewRow,
  describePreviewToggle,
  describePreviewValue,
  isLongPreviewValue,
  previewRowsInView,
} from "@/lib/data-import/preview-list";

/**
 * The first rows of a file, as the import has read them. Below the width of a wide laptop each row
 * is a small block with the name of every column above its value, because a table of 900px shows
 * only a quarter of its columns on a phone. The values sit in two, three or four columns, by the
 * width of the block itself (a container query), because the box is only 240px wide on a phone but
 * 650px on a tablet, and a tablet has room for more. A block does not scroll in a box of its own. A phone
 * shows the first two blocks, and a button under them shows the others, because eight blocks are
 * more than two screens and the person would scroll past them to reach the Apply button. A wide
 * screen has the table, in a ScrollRegion, with every row. Only one of the two is shown at a time.
 * The one that is hidden is also hidden from a screen reader and from the Tab key, because it has
 * `display: none`.
 */
export function ImportPreview({
  headers,
  rows,
}: {
  headers: string[];
  rows: Record<string, string>[];
}) {
  const [expanded, setExpanded] = useState(false);

  const [seen, setSeen] = useState(rows);

  const buttonBox = useRef<HTMLDivElement>(null);

  const foldedByButton = useRef(false);

  // A new file has new rows. Its preview starts short again, even if the last one was opened.
  if (seen !== rows) {
    setSeen(rows);

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

  const inView = rows.slice(0, previewRowsInView(rows.length, expanded));

  const toggle = describePreviewToggle(rows.length, expanded);

  return (
    <>
      <ul data-slot="import-preview-list" className="divide-y xl:hidden">
        {inView.map((row, index) => (
          <li key={index} className="@container space-y-2 px-3 py-3">
            <p className="text-xs font-medium">{describePreviewRow(index)}</p>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs @sm:grid-cols-3 @lg:grid-cols-4">
              {headers.map((header) => {
                const value = row[header] ?? "";

                return (
                  <div
                    key={header}
                    className={isLongPreviewValue(value) ? "col-span-2 min-w-0" : "min-w-0"}
                  >
                    <dt className="break-words text-muted-foreground">{header}</dt>

                    <dd
                      className={value === "" ? "break-words text-muted-foreground" : "break-words"}
                    >
                      {describePreviewValue(value)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </li>
        ))}
      </ul>

      {toggle === null ? null : (
        <div ref={buttonBox} data-slot="import-preview-toggle" className="border-t p-3 xl:hidden">
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

      <div data-slot="import-preview-table-box" className="hidden xl:block">
        <ScrollRegion label="Preview">
          <table data-slot="import-preview-table" className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  {headers.map((header) => (
                    <td key={header} className="max-w-xs break-words px-3 py-2">
                      {row[header] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </div>
    </>
  );
}
