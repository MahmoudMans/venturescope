import {
  type CsvDelimiter,
  detectCsvDelimiter,
} from "@/lib/data-import/delimiter";


/** One row of a file: its cells, and its number in the file. A blank row has a number too. */
export type CsvRow = {
  row: number;

  cells: string[];
};


export function parseCsvRows(
  input:
    string,
  delimiter:
    CsvDelimiter =
      detectCsvDelimiter(
        input,
      ),
): CsvRow[] {
  const normalized =
    input
      .replace(
        /^\uFEFF/u,
        "",
      )
      .replaceAll(
        "\r\n",
        "\n",
      )
      .replaceAll(
        "\r",
        "\n",
      );


  const rows:
    CsvRow[] =
      [];


  let rowNumber =
    1;


  let currentRow:
    string[] =
      [];


  let current =
    "";


  let quoted =
    false;


  for (
    let index =
      0;
    index <
    normalized.length;
    index +=
      1
  ) {
    const character =
      normalized[
        index
      ];


    if (
      quoted
    ) {
      if (
        character ===
        '"'
      ) {
        if (
          normalized[
            index +
            1
          ] ===
          '"'
        ) {
          current +=
            '"';

          index +=
            1;
        }
        else {
          quoted =
            false;
        }
      }
      else {
        current +=
          character;
      }


      continue;
    }


    if (
      character ===
      '"'
    ) {
      quoted =
        true;

      continue;
    }


    if (
      character ===
      delimiter
    ) {
      currentRow.push(
        current.trim(),
      );

      current =
        "";

      continue;
    }


    if (
      character ===
      "\n"
    ) {
      currentRow.push(
        current.trim(),
      );

      current =
        "";


      if (
        currentRow.some(
          (
            value,
          ) =>
            value !==
            "",
        )
      ) {
        rows.push({
          row:
            rowNumber,

          cells:
            currentRow,
        });
      }


      currentRow =
        [];

      rowNumber +=
        1;

      continue;
    }


    current +=
      character;
  }


  if (
    quoted
  ) {
    throw new Error(
      "CSV contains an unterminated quoted field.",
    );
  }


  currentRow.push(
    current.trim(),
  );


  if (
    currentRow.some(
      (
        value,
      ) =>
        value !==
        "",
    )
  ) {
    rows.push({
      row:
        rowNumber,

      cells:
        currentRow,
    });
  }


  return rows;
}


export function parseCsvMatrix(
  input:
    string,
  delimiter:
    CsvDelimiter =
      detectCsvDelimiter(
        input,
      ),
): string[][] {
  return parseCsvRows(
    input,
    delimiter,
  ).map(
    (
      item,
    ) =>
      item.cells,
  );
}


export function csvRecords(
  input:
    string,
): {
  headers:
    string[];

  records:
    Record<
      string,
      string
    >[];

  delimiter:
    CsvDelimiter;
} {
  const delimiter =
    detectCsvDelimiter(
      input,
    );


  const matrix =
    parseCsvMatrix(
      input,
      delimiter,
    );


  if (
    matrix.length ===
    0
  ) {
    throw new Error(
      "CSV is empty.",
    );
  }


  const headers =
    matrix[
      0
    ].map(
      (
        value,
      ) =>
        value.trim(),
    );


  if (
    headers.some(
      (
        header,
      ) =>
        !header,
    )
  ) {
    throw new Error(
      "CSV contains an empty header.",
    );
  }


  if (
    new Set(
      headers,
    ).size !==
    headers.length
  ) {
    throw new Error(
      "CSV contains duplicate headers.",
    );
  }


  const records =
    matrix
      .slice(
        1,
      )
      .map(
        (
          row,
        ) =>
          Object.fromEntries(
            headers.map(
              (
                header,
                index,
              ) => [
                header,
                row[
                  index
                ] ??
                "",
              ],
            ),
          ),
      );


  return {
    headers,

    records,

    delimiter,
  };
}
