import {
  auth,
} from "@/auth";
import {
  buildForecastCsv,
} from "@/lib/reports/csv";
import {
  loadReportContext,
} from "@/lib/reports/context";
import {
  reportFilename,
} from "@/lib/reports/filename";

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

  const csv =
    buildForecastCsv(
      context,
    );

  const filename =
    reportFilename(
      context.project
        .name,
      context.forecast
        .scenario.name,
      "csv",
    );

  return new Response(
    csv,
    {
      status:
        200,

      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",

        "Content-Disposition":
          `attachment; filename="${filename}"`,

        "Cache-Control":
          "private, no-store, max-age=0",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}
