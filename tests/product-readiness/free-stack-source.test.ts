import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildProductReadinessSummary,
} from "@/lib/product-readiness/calculations";


const consolidationFx =
  readFileSync(
    "lib/finance/consolidation/fx.ts",
    "utf8",
  );


const notifications =
  readFileSync(
    "lib/notifications/service.ts",
    "utf8",
  );


const dataImport =
  readFileSync(
    "lib/data-import/service.ts",
    "utf8",
  );


describe(
  "portfolio release free-stack architecture",
  () => {
    it(
      "declares zero paid APIs required",
      () => {
        expect(
          buildProductReadinessSummary()
            .paidApiCount,
        ).toBe(
          0,
        );
      },
    );


    it(
      "contains no external FX network authority",
      () => {
        expect(
          consolidationFx,
        ).not.toContain(
          "fetch(",
        );
      },
    );


    it(
      "keeps notification state internal",
      () => {
        expect(
          notifications.toLowerCase(),
        ).not.toContain(
          "twilio",
        );


        expect(
          notifications.toLowerCase(),
        ).not.toContain(
          "sendgrid",
        );
      },
    );


    it(
      "keeps governed import application local",
      () => {
        expect(
          dataImport,
        ).not.toContain(
          "fetch(",
        );
      },
    );
  },
);
