import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const source =
  readFileSync(
    "proxy.ts",
    "utf8",
  );


describe(
  "proxy correlation boundary",
  () => {
    it(
      "establishes one authoritative correlation identifier at ingress",
      () => {
        expect(
          source,
        ).toContain(
          "normalizeRequestId",
        );

        expect(
          source,
        ).toContain(
          "createRequestId",
        );

        expect(
          source,
        ).toContain(
          "const correlationId =",
        );
      },
    );


    it(
      "binds the existing security request identifier to the correlation identifier",
      () => {
        expect(
          source,
        ).toContain(
          `const requestId =
    correlationId;`,
        );
      },
    );


    it(
      "forwards the authoritative identifier to Route Handlers",
      () => {
        expect(
          source,
        ).toContain(
          "forwardedRequestHeaders",
        );

        expect(
          source,
        ).toContain(
          `"x-request-id",
    correlationId`,
        );

        expect(
          source,
        ).toContain(
          "NextResponse.next({",
        );

        expect(
          source,
        ).toContain(
          "request: {",
        );
      },
    );


    it(
      "returns the authoritative identifier to the client",
      () => {
        expect(
          source,
        ).toContain(
          `"X-Request-Id",
        correlationId`,
        );
      },
    );


    it(
      "does not redeclare requestId at ingress",
      () => {
        const declarations =
          source.match(
            /const requestId\s*=/g,
          ) ??
          [];


        expect(
          declarations,
        ).toHaveLength(
          1,
        );
      },
    );
  },
);
