import type { ReactNode } from "react";

import type { ChartTextTable } from "@/lib/charts/chart-text";

/**
 * Gives a chart a text version. A screen reader announces the chart as one picture with the
 * description in `label`, and can then read the table next to it. The table is hidden from the
 * eyes. It sits outside the picture, because a screen reader skips everything inside a picture.
 * The box around the table is the hidden one: a table ignores `width` and `overflow`, so a hidden
 * table alone would stay as wide as its text and make the page scroll sideways on a phone.
 */
export function AccessibleChart({
  label,
  table,
  className,
  children,
}: {
  label: string;
  table: ChartTextTable;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={className}>
      <div role="img" aria-label={label} className="h-full w-full">
        {children}
      </div>

      <div className="sr-only">
        <table>
          <caption>{table.caption}</caption>

          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row[0]}`}>
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th key={cellIndex} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={cellIndex}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
