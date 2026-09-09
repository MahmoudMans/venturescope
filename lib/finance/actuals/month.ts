const MIN_YEAR =
  2000;


const MAX_YEAR =
  2100;


const MONTHS:
  Record<
    string,
    number
  > = {
    jan:
      1,

    january:
      1,

    feb:
      2,

    february:
      2,

    mar:
      3,

    march:
      3,

    apr:
      4,

    april:
      4,

    may:
      5,

    jun:
      6,

    june:
      6,

    jul:
      7,

    july:
      7,

    aug:
      8,

    august:
      8,

    sep:
      9,

    sept:
      9,

    september:
      9,

    oct:
      10,

    october:
      10,

    nov:
      11,

    november:
      11,

    dec:
      12,

    december:
      12,
  };


function validYear(
  year:
    number,
): boolean {
  return (
    Number.isInteger(
      year,
    ) &&
    year >=
      MIN_YEAR &&
    year <=
      MAX_YEAR
  );
}


function validMonth(
  month:
    number,
): boolean {
  return (
    Number.isInteger(
      month,
    ) &&
    month >=
      1 &&
    month <=
      12
  );
}


function key(
  year:
    number,
  month:
    number,
): string |
  null {
  if (
    !validYear(
      year,
    ) ||
    !validMonth(
      month,
    )
  ) {
    return null;
  }


  return `${year
    .toString()
    .padStart(
      4,
      "0",
    )}-${month
    .toString()
    .padStart(
      2,
      "0",
    )}`;
}


function monthNumber(
  value:
    string,
): number |
  null {
  return MONTHS[
    value
      .trim()
      .toLowerCase()
      .replace(
        /\.$/u,
        "",
      )
  ] ??
    null;
}


/**
 * Parse month representations without using JavaScript's ambiguous
 * locale/local-time Date string parser.
 *
 * Supported examples:
 *
 * 2027-01
 * 2027-01-31
 * 2027/01
 * 01/2027
 * Jan 2027
 * January 2027
 * 2027 Jan
 * 2027 January
 */
export function parseMonthKey(
  raw:
    string,
): string |
  null {
  const trimmed =
    raw.trim();


  if (
    !trimmed
  ) {
    return null;
  }


  const yearMonth =
    /^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/u.exec(
      trimmed,
    );


  if (
    yearMonth
  ) {
    return key(
      Number(
        yearMonth[
          1
        ],
      ),
      Number(
        yearMonth[
          2
        ],
      ),
    );
  }


  const monthYear =
    /^(\d{1,2})[-/](\d{4})$/u.exec(
      trimmed,
    );


  if (
    monthYear
  ) {
    return key(
      Number(
        monthYear[
          2
        ],
      ),
      Number(
        monthYear[
          1
        ],
      ),
    );
  }


  const namedMonthYear =
    /^([A-Za-z]{3,9})[\s,/-]+(\d{4})$/u.exec(
      trimmed,
    );


  if (
    namedMonthYear
  ) {
    const month =
      monthNumber(
        namedMonthYear[
          1
        ],
      );


    return month ===
      null
      ?
        null
      :
        key(
          Number(
            namedMonthYear[
              2
            ],
          ),
          month,
        );
  }


  const yearNamedMonth =
    /^(\d{4})[\s,/-]+([A-Za-z]{3,9})$/u.exec(
      trimmed,
    );


  if (
    yearNamedMonth
  ) {
    const month =
      monthNumber(
        yearNamedMonth[
          2
        ],
      );


    return month ===
      null
      ?
        null
      :
        key(
          Number(
            yearNamedMonth[
              1
            ],
          ),
          month,
        );
  }


  return null;
}


export function parseMonthStartUtc(
  raw:
    string,
): Date |
  null {
  const parsed =
    parseMonthKey(
      raw,
    );


  if (
    !parsed
  ) {
    return null;
  }


  const [
    year,
    month,
  ] =
    parsed
      .split(
        "-",
      )
      .map(
        Number,
      );


  return new Date(
    Date.UTC(
      year,
      month -
        1,
      1,
    ),
  );
}


export function formatMonthKey(
  date:
    Date,
): string {
  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "Cannot format an invalid month date.",
    );
  }


  return `${date
    .getUTCFullYear()
    .toString()
    .padStart(
      4,
      "0",
    )}-${(
    date.getUTCMonth() +
    1
  )
    .toString()
    .padStart(
      2,
      "0",
    )}`;
}
