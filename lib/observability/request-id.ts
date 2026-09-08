const REQUEST_ID_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;


export function normalizeRequestId(
  value:
    string |
    null |
    undefined,
): string | null {
  const candidate =
    value?.trim();

  if (
    !candidate ||
    !REQUEST_ID_PATTERN.test(
      candidate,
    )
  ) {
    return null;
  }

  return candidate;
}


export function createRequestId(): string {
  return crypto.randomUUID();
}


export function resolveRequestId(
  headers:
    Headers,
): string {
  return (
    normalizeRequestId(
      headers.get(
        "x-request-id",
      ),
    ) ??
    createRequestId()
  );
}
