import {
  z,
} from "zod";

const serverEnvironmentSchema =
  z.object({
    NODE_ENV:
      z
        .enum([
          "development",
          "test",
          "production",
        ])
        .default(
          "development",
        ),

    DATABASE_URL:
      z
        .string()
        .trim()
        .min(
          1,
          "DATABASE_URL is required.",
        )
        .refine(
          (
            value,
          ) =>
            value.startsWith(
              "postgresql://",
            ) ||
            value.startsWith(
              "postgres://",
            ),
          "DATABASE_URL must be a PostgreSQL connection string.",
        ),

    AUTH_SECRET:
      z
        .string()
        .min(
          32,
          "AUTH_SECRET must contain at least 32 characters.",
        ),

    AUTH_URL:
      z
        .string()
        .url(
          "AUTH_URL must be an absolute URL.",
        )
        .optional(),

    TRUST_PROXY_HEADERS:
      z
        .enum([
          "true",
          "false",
        ])
        .optional()
        .default(
          "false",
        ),

    APP_VERSION:
      z
        .string()
        .trim()
        .min(
          1,
        )
        .optional(),
  });

export type ServerEnvironment =
  z.infer<
    typeof serverEnvironmentSchema
  >;

let cached:
  | ServerEnvironment
  | undefined;

export function parseServerEnvironment(
  source:
    Record<
      string,
      string | undefined
    >,
): ServerEnvironment {
  const parsed =
    serverEnvironmentSchema.safeParse(
      source,
    );

  if (
    !parsed.success
  ) {
    const issues =
      parsed.error.issues
        .map(
          (
            issue,
          ) =>
            `${issue.path.join(".") || "environment"}: ${issue.message}`,
        )
        .join(
          "; ",
        );

    throw new Error(
      `Invalid VentureScope server environment: ${issues}`,
    );
  }

  return parsed.data;
}

export function getServerEnvironment(): ServerEnvironment {
  cached ??=
    parseServerEnvironment(
      process.env,
    );

  return cached;
}
