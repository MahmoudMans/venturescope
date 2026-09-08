import {
  NextResponse,
} from "next/server";

import {
  logStructured,
} from "@/lib/observability/logger";
import {
  getSlowRequestThresholdMs,
  recordRequestObservation,
} from "@/lib/observability/metrics";
import {
  resolveRequestId,
} from "@/lib/observability/request-id";


type JsonBody =
  Record<
    string,
    unknown
  >;


export type ObservedJsonResult = {
  status?:
    number;

  body:
    JsonBody;
};


type ObservedHandler =
  (
    requestId:
      string,
  ) =>
    Promise<
      ObservedJsonResult
    > |
    ObservedJsonResult;


export async function observedJsonRoute(
  route:
    string,
  request:
    Request,
  handler:
    ObservedHandler,
): Promise<
  NextResponse
> {
  const requestId =
    resolveRequestId(
      request.headers,
    );

  const started =
    performance.now();


  try {
    const result =
      await handler(
        requestId,
      );


    const status =
      result.status ??
      200;


    const durationMs =
      performance.now() -
      started;


    const failed =
      status >=
      500;


    recordRequestObservation({
      route,
      status,
      durationMs,
      failed,
    });


    const metadata = {
      requestId,
      route,
      method:
        request.method,
      status,
      durationMs:
        Math.round(
          durationMs *
            100,
        ) /
        100,
    };


    if (
      failed
    ) {
      logStructured(
        "error",
        "http.request",
        metadata,
      );
    }
    else if (
      durationMs >=
      getSlowRequestThresholdMs()
    ) {
      logStructured(
        "warn",
        "http.request.slow",
        metadata,
      );
    }
    else {
      logStructured(
        "info",
        "http.request",
        metadata,
      );
    }


    return NextResponse.json(
      {
        ...result.body,

        requestId,
      },
      {
        status,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",

          "Server-Timing":
            `app;dur=${durationMs.toFixed(
              1,
            )}`,

          "X-Request-Id":
            requestId,

          "X-Robots-Tag":
            "noindex, nofollow",
        },
      },
    );
  }
  catch (
    error
  ) {
    const durationMs =
      performance.now() -
      started;


    recordRequestObservation({
      route,
      status:
        500,
      durationMs,
      failed:
        true,
    });


    logStructured(
      "error",
      "http.request.exception",
      {
        requestId,
        route,
        method:
          request.method,
        status:
          500,
        durationMs:
          Math.round(
            durationMs *
              100,
          ) /
          100,
        errorName:
          error instanceof Error
            ?
              error.name
            :
              "UnknownError",
      },
    );


    return NextResponse.json(
      {
        status:
          "error",

        requestId,
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",

          "Server-Timing":
            `app;dur=${durationMs.toFixed(
              1,
            )}`,

          "X-Request-Id":
            requestId,

          "X-Robots-Tag":
            "noindex, nofollow",
        },
      },
    );
  }
}
