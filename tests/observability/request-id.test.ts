import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeRequestId,
  resolveRequestId,
} from "@/lib/observability/request-id";


describe(
  "request correlation identifiers",
  () => {
    it(
      "preserves safe inbound request identifiers",
      () => {
        expect(
          normalizeRequestId(
            "request-12345678",
          ),
        ).toBe(
          "request-12345678",
        );
      },
    );


    it(
      "rejects malformed inbound identifiers",
      () => {
        expect(
          normalizeRequestId(
            "../../bad request",
          ),
        ).toBeNull();

        expect(
          normalizeRequestId(
            "tiny",
          ),
        ).toBeNull();
      },
    );


    it(
      "generates an identifier when none is supplied",
      () => {
        const requestId =
          resolveRequestId(
            new Headers(),
          );


        expect(
          requestId.length,
        ).toBeGreaterThanOrEqual(
          8,
        );
      },
    );
  },
);
