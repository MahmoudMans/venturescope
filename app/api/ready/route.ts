import {
  prisma,
} from "@/lib/db/prisma";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`
      SELECT 1
    `;

    return Response.json(
      {
        status:
          "ready",

        database:
          "available",

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
  catch {
    return Response.json(
      {
        status:
          "not-ready",

        database:
          "unavailable",

        timestamp:
          new Date()
            .toISOString(),
      },
      {
        status:
          503,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}
