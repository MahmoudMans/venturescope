import { auth } from "@/auth";
import { buildDataExport, dataExportFilename } from "@/lib/account/data-export";
import { DATA_EXPORT_LIMIT, DATA_EXPORT_WINDOW_MS } from "@/lib/account/data-export-info";
import { loadDataExportSource } from "@/lib/account/data-export-query";
import { buildZip } from "@/lib/account/zip";
import { logAccountSecurityEvent } from "@/lib/security/account-events";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const NO_STORE = "private, no-store, max-age=0";

/**
 * Downloads one ZIP file with everything that belongs to the signed-in person:
 * the profile, the workspaces and the models they own. The file is created when
 * it is asked for and is not saved on the server. The person is always the one
 * in the session, so nobody can ask for the data of someone else.
 */
export async function GET() {
  const session = await auth();

  const userId = session?.user?.id;

  if (userId === undefined || userId === "") {
    return new Response("Unauthorized", { status: 401 });
  }

  const limit = checkRateLimit({
    key: `data-export:${userId}`,

    limit: DATA_EXPORT_LIMIT,

    windowMs: DATA_EXPORT_WINDOW_MS,
  });

  if (limit.allowed === false) {
    logAccountSecurityEvent("data.export.rejected", userId, {
      reason: "rate-limit",
    });

    return new Response("Too many downloads. Please try again in a few minutes.", {
      status: 429,

      headers: {
        "Retry-After": String(limit.retryAfterSeconds),

        "Cache-Control": NO_STORE,
      },
    });
  }

  const source = await loadDataExportSource(userId);

  if (source === null) {
    return new Response("Account not found.", { status: 404 });
  }

  const exportedAt = new Date();

  const result = buildDataExport(source, exportedAt);

  const zip = buildZip(result.entries, exportedAt);

  logAccountSecurityEvent("data.exported", userId, {
    models: result.summary.models,

    workspaces: result.summary.workspaces,

    files: result.summary.files,

    bytes: zip.byteLength,
  });

  return new Response(Uint8Array.from(zip).buffer, {
    status: 200,

    headers: {
      "Content-Type": "application/zip",

      "Content-Disposition": `attachment; filename="${dataExportFilename(exportedAt)}"`,

      "Content-Length": String(zip.byteLength),

      "Cache-Control": NO_STORE,

      "X-Content-Type-Options": "nosniff",
    },
  });
}
