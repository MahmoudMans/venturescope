import {
  auth,
} from "@/auth";
import {
  loadReportContext,
} from "@/lib/reports/context";
import {
  reportFilename,
} from "@/lib/reports/filename";
import {
  buildExecutivePdf,
} from "@/lib/reports/pdf";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      projectId: string;
    }>;
  },
) {
  const session =
    await auth();

  if (
    !session?.user?.id
  ) {
    return new Response(
      "Unauthorized",
      {
        status:
          401,
      },
    );
  }

  const {
    projectId,
  } = await params;

  const url =
    new URL(
      request.url,
    );

  const scenarioId =
    url.searchParams.get(
      "scenario",
    ) ??
    undefined;

  const context =
    await loadReportContext(
      session.user.id,
      projectId,
      scenarioId,
    );

  if (!context) {
    return new Response(
      "Financial model not found.",
      {
        status:
          404,
      },
    );
  }

  if (
    !context.ready
  ) {
    return new Response(
      "Financial assumptions are incomplete.",
      {
        status:
          409,
      },
    );
  }

  const pdfBytes =
    await buildExecutivePdf(
      context,
    );

  const filename =
    reportFilename(
      context.project
        .name,
      context.forecast
        .scenario.name,
      "pdf",
    );

  const body =
    Uint8Array.from(
      pdfBytes,
    ).buffer;

  return new Response(
    body,
    {
      status:
        200,

      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `attachment; filename="${filename}"`,

        "Content-Length":
          String(
            pdfBytes.byteLength,
          ),

        "Cache-Control":
          "private, no-store, max-age=0",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}
