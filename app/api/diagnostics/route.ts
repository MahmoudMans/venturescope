import {
  collectDiagnostics,
  diagnosticsEnabled,
  isDiagnosticsAuthorized,
} from "@/lib/observability/diagnostics";
import {
  observedJsonRoute,
} from "@/lib/observability/route";


export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";


export function GET(
  request:
    Request,
) {
  return observedJsonRoute(
    "api.diagnostics",
    request,
    async () => {
      if (
        !diagnosticsEnabled() ||
        !isDiagnosticsAuthorized(
          request.headers,
        )
      ) {
        return {
          status:
            404,

          body: {
            status:
              "not_found",
          },
        };
      }


      const diagnostics =
        await collectDiagnostics();


      return {
        body: {
          status:
            "ok",

          diagnostics,
        },
      };
    },
  );
}
