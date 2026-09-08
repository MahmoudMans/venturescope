type Primitive =
  string |
  number |
  boolean |
  null;

type LogValue =
  Primitive |
  Primitive[] |
  {
    [key: string]:
      LogValue;
  };


type LogMetadata = {
  [key: string]:
    LogValue;
};


const SENSITIVE_KEY =
  /secret|password|passwd|token|authorization|cookie|database[_-]?url|email|session/i;


function sanitizeValue(
  key:
    string,
  value:
    unknown,
  depth:
    number,
): LogValue {
  if (
    SENSITIVE_KEY.test(
      key,
    )
  ) {
    return "[REDACTED]";
  }


  if (
    value ===
      null ||
    typeof value ===
      "string" ||
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }


  if (
    depth >=
    3
  ) {
    return "[TRUNCATED]";
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    return value
      .slice(
        0,
        20,
      )
      .map(
        (
          entry,
        ) =>
          sanitizeValue(
            "array",
            entry,
            depth +
              1,
          ) as Primitive,
      )
      .filter(
        (
          entry,
        ):
          entry is Primitive =>
            typeof entry ===
              "string" ||
            typeof entry ===
              "number" ||
            typeof entry ===
              "boolean" ||
            entry ===
              null,
      );
  }


  if (
    typeof value ===
      "object"
  ) {
    const result:
      LogMetadata =
        {};


    for (
      const [
        childKey,
        childValue,
      ]
      of Object.entries(
        value,
      ).slice(
        0,
        30,
      )
    ) {
      result[
        childKey
      ] =
        sanitizeValue(
          childKey,
          childValue,
          depth +
            1,
        );
    }


    return result;
  }


  return String(
    value,
  );
}


export function sanitizeLogMetadata(
  metadata:
    Record<
      string,
      unknown
    >,
): LogMetadata {
  const sanitized:
    LogMetadata =
      {};


  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      metadata,
    )
  ) {
    sanitized[
      key
    ] =
      sanitizeValue(
        key,
        value,
        0,
      );
  }


  return sanitized;
}


export function logStructured(
  level:
    "info" |
    "warn" |
    "error",
  event:
    string,
  metadata:
    Record<
      string,
      unknown
    > =
      {},
): void {
  const payload = {
    event:
      "venturescope.observability",

    timestamp:
      new Date()
        .toISOString(),

    level,

    name:
      event,

    service:
      "venturescope",

    version:
      process.env
        .APP_VERSION ??
      "development",

    environment:
      process.env
        .NODE_ENV ??
      "development",

    ...sanitizeLogMetadata(
      metadata,
    ),
  };


  const serialized =
    JSON.stringify(
      payload,
    );


  if (
    level ===
    "error"
  ) {
    console.error(
      serialized,
    );

    return;
  }


  if (
    level ===
    "warn"
  ) {
    console.warn(
      serialized,
    );

    return;
  }


  console.log(
    serialized,
  );
}
