import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  checkRateLimit,
} from "@/lib/security/rate-limit";

const STATE_CHANGING_METHODS =
  new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

function firstHeaderValue(
  value:
    | string
    | null,
): string | null {
  if (!value) {
    return null;
  }

  return (
    value
      .split(
        ",",
      )[0]
      ?.trim() ??
    null
  );
}

function trustProxyHeaders(): boolean {
  return (
    process.env
      .TRUST_PROXY_HEADERS ===
    "true"
  );
}

function expectedOrigin(
  request: NextRequest,
): string | null {
  const trustProxy =
    trustProxyHeaders();

  const host =
    firstHeaderValue(
      trustProxy
        ? request.headers.get(
            "x-forwarded-host",
          ) ??
          request.headers.get(
            "host",
          )
        : request.headers.get(
            "host",
          ),
    );

  if (!host) {
    return null;
  }

  const forwardedProtocol =
    trustProxy
      ? firstHeaderValue(
          request.headers.get(
            "x-forwarded-proto",
          ),
        )
      : null;

  const protocol =
    forwardedProtocol ??
    request.nextUrl.protocol.replace(
      ":",
      "",
    );

  return `${protocol}://${host}`;
}

function rateLimitIdentity(
  request: NextRequest,
): string {
  const trustProxy =
    trustProxyHeaders();

  if (
    trustProxy
  ) {
    const forwarded =
      firstHeaderValue(
        request.headers.get(
          "x-forwarded-for",
        ),
      );

    if (
      forwarded
    ) {
      return `ip:${forwarded}`;
    }

    const realIp =
      request.headers.get(
        "x-real-ip",
      );

    if (
      realIp
    ) {
      return `ip:${realIp}`;
    }
  }

  const userAgent =
    request.headers.get(
      "user-agent",
    ) ??
    "unknown";

  const language =
    request.headers.get(
      "accept-language",
    ) ??
    "unknown";

  return `client:${userAgent.slice(
    0,
    100,
  )}:${language.slice(
    0,
    40,
  )}`;
}

function tooManyRequests(
  result: {
    remaining: number;

    retryAfterSeconds: number;

    resetAt: number;
  },
) {
  return NextResponse.json(
    {
      error:
        "Too many requests. Please try again later.",
    },
    {
      status:
        429,

      headers: {
        "Retry-After":
          String(
            result.retryAfterSeconds,
          ),

        "X-RateLimit-Remaining":
          String(
            result.remaining,
          ),

        "X-RateLimit-Reset":
          String(
            Math.ceil(
              result.resetAt /
              1000,
            ),
          ),

        "Cache-Control":
          "private, no-store",
      },
    },
  );
}

export function proxy(
  request: NextRequest,
) {
  const requestId =
    globalThis.crypto.randomUUID();

  if (
    STATE_CHANGING_METHODS.has(
      request.method,
    )
  ) {
    const suppliedOrigin =
      request.headers.get(
        "origin",
      );

    const requiredOrigin =
      expectedOrigin(
        request,
      );

    if (
      suppliedOrigin &&
      requiredOrigin &&
      suppliedOrigin !==
        requiredOrigin
    ) {
      return NextResponse.json(
        {
          error:
            "Cross-origin state-changing request rejected.",
        },
        {
          status:
            403,

          headers: {
            "Cache-Control":
              "private, no-store",

            "X-Request-Id":
              requestId,
          },
        },
      );
    }
  }

  const identity =
    rateLimitIdentity(
      request,
    );

  if (
    request.method ===
      "POST" &&
    request.nextUrl.pathname ===
      "/register"
  ) {
    const result =
      checkRateLimit({
        key:
          `register:${identity}`,

        limit:
          10,

        windowMs:
          60 *
          60 *
          1000,
      });

    if (
      !result.allowed
    ) {
      return tooManyRequests(
        result,
      );
    }
  }

  if (
    request.method ===
      "POST" &&
    request.nextUrl.pathname ===
      "/api/auth/callback/credentials"
  ) {
    const result =
      checkRateLimit({
        key:
          `credentials:${identity}`,

        limit:
          30,

        windowMs:
          15 *
          60 *
          1000,
      });

    if (
      !result.allowed
    ) {
      return tooManyRequests(
        result,
      );
    }
  }

  const response =
    NextResponse.next();

  response.headers.set(
    "X-Request-Id",
    requestId,
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
