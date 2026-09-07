export function monthInputToUtcDate(
  value: string,
): Date {
  const [
    yearValue,
    monthValue,
  ] = value.split("-");

  const year = Number(yearValue);
  const month = Number(monthValue);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      1,
    ),
  );
}

export function dateToMonthInput(
  date: Date,
): string {
  const year =
    date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(
    2,
    "0",
  );

  return `${year}-${month}`;
}

export function formatProjectStartMonth(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(date);
}

export function formatProjectUpdatedAt(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}
