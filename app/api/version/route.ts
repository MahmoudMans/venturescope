import {
  NextResponse,
} from "next/server";

import {
  buildReleaseVersionPayload,
} from "@/lib/operations/version";


export const dynamic =
  "force-dynamic";


export function GET() {
  return NextResponse.json(
    buildReleaseVersionPayload(),
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",

        "X-Robots-Tag":
          "noindex, nofollow",
      },
    },
  );
}
