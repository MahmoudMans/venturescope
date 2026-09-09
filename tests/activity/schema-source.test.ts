import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";


const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );


const migration =
  readFileSync(
    "prisma/migrations/20260909190000_step37_project_audit_ledger/migration.sql",
    "utf8",
  );


describe(
  "ProjectAuditEvent persistence",
  () => {
    it(
      "persists project category action actor and metadata",
      () => {
        expect(
          schema,
        ).toContain(
          "model ProjectAuditEvent",
        );


        expect(
          schema,
        ).toMatch(
          /projectId\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /category\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /action\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /actorUserId\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /metadata\s+Json\?/,
        );
      },
    );


    it(
      "does not create project or user foreign-key relations",
      () => {
        const auditModel =
          schema
            .split(
              "model ProjectAuditEvent",
            )[
              1
            ]
            ?.split(
              "\n}",
            )[
              0
            ] ??
          "";


        expect(
          auditModel,
        ).not.toContain(
          "@relation",
        );
      },
    );


    it(
      "protects audit rows from UPDATE and DELETE",
      () => {
        expect(
          migration,
        ).toContain(
          "ProjectAuditEvent_immutable_guard",
        );


        expect(
          migration,
        ).toContain(
          "BEFORE UPDATE OR DELETE",
        );


        expect(
          migration,
        ).toContain(
          "RAISE EXCEPTION",
        );
      },
    );
  },
);
