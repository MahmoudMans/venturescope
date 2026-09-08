import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  diagnosticsEnabled,
  isDiagnosticsAuthorized,
} from "@/lib/observability/diagnostics";


const ORIGINAL =
  process.env
    .VENTURESCOPE_DIAGNOSTICS_TOKEN;


afterEach(
  () => {
    if (
      ORIGINAL ===
      undefined
    ) {
      delete process.env
        .VENTURESCOPE_DIAGNOSTICS_TOKEN;
    }
    else {
      process.env.VENTURESCOPE_DIAGNOSTICS_TOKEN =
        ORIGINAL;
    }
  },
);


describe(
  "diagnostics authorization",
  () => {
    it(
      "stays disabled without a sufficiently strong token",
      () => {
        delete process.env
          .VENTURESCOPE_DIAGNOSTICS_TOKEN;


        expect(
          diagnosticsEnabled(),
        ).toBe(
          false,
        );
      },
    );


    it(
      "requires the exact bearer token",
      () => {
        process.env.VENTURESCOPE_DIAGNOSTICS_TOKEN =
          "1234567890123456789012345678901234567890";


        expect(
          diagnosticsEnabled(),
        ).toBe(
          true,
        );


        expect(
          isDiagnosticsAuthorized(
            new Headers({
              Authorization:
                "Bearer wrong-token-value-that-is-long-enough-1234",
            }),
          ),
        ).toBe(
          false,
        );


        expect(
          isDiagnosticsAuthorized(
            new Headers({
              Authorization:
                "Bearer 1234567890123456789012345678901234567890",
            }),
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
