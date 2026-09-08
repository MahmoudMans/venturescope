import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const deploy =
  readFileSync(
    "scripts/deploy-production.sh",
    "utf8",
  );

const rollback =
  readFileSync(
    "scripts/rollback-production.sh",
    "utf8",
  );

const common =
  readFileSync(
    "scripts/lib/deployment-common.sh",
    "utf8",
  );


describe(
  "production deployment safety contract",
  () => {
    it(
      "requires explicit production deployment confirmation",
      () => {
        expect(
          deploy,
        ).toContain(
          'VENTURESCOPE_DEPLOY_CONFIRM:-NO',
        );

        expect(
          deploy,
        ).toContain(
          '!= "YES"',
        );
      },
    );


    it(
      "requires explicit rollback confirmation",
      () => {
        expect(
          rollback,
        ).toContain(
          'VENTURESCOPE_ROLLBACK_CONFIRM:-NO',
        );
      },
    );


    it(
      "does not automatically restore the database after failed smoke",
      () => {
        expect(
          deploy,
        ).toContain(
          "Database is NOT automatically restored",
        );

        expect(
          deploy,
        ).not.toContain(
          'VENTURESCOPE_ALLOW_RESTORE="YES"',
        );
      },
    );


    it(
      "requires a second explicit lock for database rollback",
      () => {
        expect(
          rollback,
        ).toContain(
          'VENTURESCOPE_ROLLBACK_DATABASE:-NO',
        );

        expect(
          rollback,
        ).toContain(
          'VENTURESCOPE_ALLOW_RESTORE:-NO',
        );
      },
    );


    it(
      "uses an atomic filesystem deployment lock",
      () => {
        expect(
          common,
        ).toContain(
          "deployment.lock",
        );

        expect(
          common,
        ).toContain(
          "mkdir",
        );

        expect(
          common,
        ).toContain(
          "VENTURESCOPE_FORCE_UNLOCK",
        );
      },
    );


    it(
      "persists only non-secret deployment metadata",
      () => {
        expect(
          common,
        ).toContain(
          "RELEASE_IMAGE=",
        );

        expect(
          common,
        ).toContain(
          "PREVIOUS_IMAGE=",
        );

        expect(
          common,
        ).toContain(
          "BACKUP_FILE=",
        );

        expect(
          common,
        ).not.toContain(
          "AUTH_SECRET=",
        );

        expect(
          common,
        ).not.toContain(
          "DATABASE_URL=",
        );
      },
    );
  },
);
