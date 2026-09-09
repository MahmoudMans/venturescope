import type {
  JsonValue,
} from "@/lib/projects/version-diff/types";


export function normalizeJsonValue(
  value:
    unknown,
): JsonValue {
  if (
    value ===
    null
  ) {
    return null;
  }


  switch (
    typeof value
  ) {
    case "string":
      return value;


    case "boolean":
      return value;


    case "number":
      if (
        !Number.isFinite(
          value,
        )
      ) {
        throw new Error(
          "Model revision contains a non-finite numeric value.",
        );
      }


      return value;


    case "object":
      if (
        Array.isArray(
          value,
        )
      ) {
        return value.map(
          normalizeJsonValue,
        );
      }


      return Object.fromEntries(
        Object.entries(
          value as
            Record<
              string,
              unknown
            >,
        ).map(
          (
            [
              key,
              child,
            ],
          ) => [
            key,
            normalizeJsonValue(
              child,
            ),
          ],
        ),
      );


    default:
      throw new Error(
        "Model revision contains an unsupported JSON value.",
      );
  }
}


export function summarizeJsonValue(
  value:
    JsonValue |
    null,
  maximumLength =
    140,
): string {
  const serialized =
    JSON.stringify(
      value,
    );


  if (
    serialized.length <=
    maximumLength
  ) {
    return serialized;
  }


  return `${serialized.slice(
    0,
    Math.max(
      0,
      maximumLength -
        1,
    ),
  )}…`;
}
