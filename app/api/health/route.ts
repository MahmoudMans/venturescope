export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status:
        "ok",

      service:
        "venturescope",

      version:
        process.env
          .APP_VERSION ??
        "development",

      timestamp:
        new Date()
          .toISOString(),
    },
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}
