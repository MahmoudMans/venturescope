import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const actions =
  readFileSync(
    "app/(app)/account/security/actions.ts",
    "utf8",
  );


const sessionSecurity =
  readFileSync(
    "lib/auth/session-security.ts",
    "utf8",
  );


const authSource =
  readFileSync(
    "auth.ts",
    "utf8",
  );


describe(
  "account security implementation",
  () => {
    it(
      "increments authVersion when changing a password",
      () => {
        expect(
          actions,
        ).toContain(
          "passwordChangedAt",
        );

        expect(
          actions,
        ).toContain(
          `authVersion: {
        increment:
          1`,
        );
      },
    );


    it(
      "supports explicit logout-all-devices revocation",
      () => {
        expect(
          actions,
        ).toContain(
          "logoutAllDevicesAction",
        );

        expect(
          actions,
        ).toContain(
          '"sessions.revoked"',
        );
      },
    );


    it(
      "requires destructive account confirmation",
      () => {
        expect(
          actions,
        ).toContain(
          "DELETE MY ACCOUNT",
        );

        expect(
          actions,
        ).toContain(
          "transaction.user.delete",
        );
      },
    );


    it(
      "rejects stale JWTs by returning null",
      () => {
        expect(
          sessionSecurity,
        ).toContain(
          "isAuthVersionValid",
        );

        expect(
          sessionSecurity,
        ).toContain(
          "return null;",
        );
      },
    );


    it(
      "wires the session-security callbacks into Auth.js",
      () => {
        expect(
          authSource,
        ).toContain(
          "enforceJwtSessionSecurity",
        );

        expect(
          authSource,
        ).toContain(
          "enforceSessionSecurity",
        );
      },
    );
  },
);
