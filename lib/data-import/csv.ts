export function parseCsvMatrix(
  input:
    string,
): string[][] {
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
    string[][] =
      [];


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
      ","
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
        rows.push(
          currentRow,
        );
      }


      currentRow =
        [];

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
    rows.push(
      currentRow,
    );
  }


  return rows;
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
} {
  const matrix =
    parseCsvMatrix(
      input,
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
  };
}
