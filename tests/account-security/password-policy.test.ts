import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validatePasswordPolicy,
} from "@/lib/auth/password-policy";


describe(
  "account password policy",
  () => {
    it(
      "accepts a strong password",
      () => {
        expect(
          validatePasswordPolicy(
            "VentureScope!2026",
          ),
        ).toEqual({
          valid:
            true,

          issues:
            [],
        });
      },
    );


    it(
      "rejects short passwords",
      () => {
        expect(
          validatePasswordPolicy(
            "Short!1",
          ).valid,
        ).toBe(
          false,
        );
      },
    );


    it(
      "requires upper, lower, numeric and symbol characters",
      () => {
        expect(
          validatePasswordPolicy(
            "onlylowercasepassword",
          ).valid,
        ).toBe(
          false,
        );

        expect(
          validatePasswordPolicy(
            "ONLYUPPERCASE1234!",
          ).valid,
        ).toBe(
          false,
        );

        expect(
          validatePasswordPolicy(
            "NoNumberHere!!!!",
          ).valid,
        ).toBe(
          false,
        );

        expect(
          validatePasswordPolicy(
            "NoSymbolHere1234",
          ).valid,
        ).toBe(
          false,
        );
      },
    );
  },
);
