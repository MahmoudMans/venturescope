import {
  observedJsonRoute,
} from "@/lib/observability/route";


export const dynamic =
  "force-dynamic";


export function GET(
  request:
    Request,
) {
  return observedJsonRoute(
    "api.observability",
    request,
    (
      requestId,
    ) => ({
      body: {
        status:
          "ok",

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

        uptimeSeconds:
          Math.round(
            process.uptime() *
              100,
          ) /
          100,

        correlation:
          requestId,
      },
    }),
  );
}
