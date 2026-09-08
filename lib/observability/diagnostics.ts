import {
  timingSafeEqual,
} from "node:crypto";

import {
  snapshotRequestMetrics,
} from "@/lib/observability/metrics";


function configuredToken(): string {
  return (
    process.env
      .VENTURESCOPE_DIAGNOSTICS_TOKEN ??
    ""
  ).trim();
}


function bearerToken(
  headers:
    Headers,
): string {
  const authorization =
    headers.get(
      "authorization",
    ) ??
    "";


  if (
    !authorization
      .toLowerCase()
      .startsWith(
        "bearer ",
      )
  ) {
    return "";
  }


  return authorization
    .slice(
      7,
    )
    .trim();
}


function secureStringEqual(
  left:
    string,
  right:
    string,
): boolean {
  if (
    !left ||
    !right
  ) {
    return false;
  }


  const leftBytes =
    Buffer.from(
      left,
      "utf8",
    );

  const rightBytes =
    Buffer.from(
      right,
      "utf8",
    );


  if (
    leftBytes.length !==
    rightBytes.length
  ) {
    return false;
  }


  return timingSafeEqual(
    leftBytes,
    rightBytes,
  );
}


export function diagnosticsEnabled(): boolean {
  return (
    configuredToken()
      .length >=
    32
  );
}


export function isDiagnosticsAuthorized(
  headers:
    Headers,
): boolean {
  const expected =
    configuredToken();


  if (
    expected.length <
    32
  ) {
    return false;
  }


  return secureStringEqual(
    bearerToken(
      headers,
    ),
    expected,
  );
}


function toMegabytes(
  bytes:
    number,
): number {
  return (
    Math.round(
      (
        bytes /
        1024 /
        1024
      ) *
        100,
    ) /
    100
  );
}


async function collectDatabaseDiagnostics(): Promise<{
  status:
    "ready" |
    "unavailable";

  latencyMs:
    number;
}> {
  const started =
    performance.now();


  let status:
    "ready" |
    "unavailable" =
      "ready";


  try {
    /*
     * Prisma is intentionally imported lazily.
     *
     * Token authorization helpers must remain independently
     * importable in unit tests without requiring DATABASE_URL
     * or AUTH_SECRET.
     *
     * Database/server environment validation therefore occurs
     * only when deep runtime diagnostics actually probe the DB.
     */
    const {
      prisma,
    } =
      await import(
        "@/lib/db/prisma"
      );


    await prisma
      .$queryRaw`
        SELECT 1
      `;
  }
  catch {
    status =
      "unavailable";
  }


  const latencyMs =
    performance.now() -
    started;


  return {
    status,

    latencyMs:
      Math.round(
        latencyMs *
          100,
      ) /
      100,
  };
}


export async function collectDiagnostics() {
  const memory =
    process.memoryUsage();


  const database =
    await collectDatabaseDiagnostics();


  return {
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

    runtime: {
      node:
        process.versions
          .node,

      uptimeSeconds:
        Math.round(
          process.uptime() *
            100,
        ) /
        100,
    },

    memoryMb: {
      rss:
        toMegabytes(
          memory.rss,
        ),

      heapUsed:
        toMegabytes(
          memory.heapUsed,
        ),

      heapTotal:
        toMegabytes(
          memory.heapTotal,
        ),

      external:
        toMegabytes(
          memory.external,
        ),
    },

    database,

    requests:
      snapshotRequestMetrics(),
  };
}
