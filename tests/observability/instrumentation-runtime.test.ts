import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const entry =
  readFileSync(
    "instrumentation.ts",
    "utf8",
  );


const nodeRuntime =
  readFileSync(
    "lib/observability/instrumentation-node.ts",
    "utf8",
  );


describe(
  "runtime-safe instrumentation",
  () => {
    it(
      "keeps Node-only process APIs out of the shared entrypoint",
      () => {
        expect(
          entry,
        ).not.toContain(
          "process.pid",
        );

        expect(
          entry,
        ).not.toContain(
          "process.uptime()",
        );

        expect(
          entry,
        ).not.toContain(
          "process.versions",
        );
      },
    );


    it(
      "loads startup telemetry only under the Node runtime",
      () => {
        expect(
          entry,
        ).toContain(
          "NEXT_RUNTIME",
        );

        expect(
          entry,
        ).toContain(
          "instrumentation-node",
        );
      },
    );


    it(
      "retains detailed Node startup telemetry",
      () => {
        expect(
          nodeRuntime,
        ).toContain(
          "process.pid",
        );

        expect(
          nodeRuntime,
        ).toContain(
          "process.uptime()",
        );

        expect(
          nodeRuntime,
        ).toContain(
          "process.versions",
        );
      },
    );
  },
);
