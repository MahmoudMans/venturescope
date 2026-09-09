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


describe(
  "ApprovalRequest schema",
  () => {
    it(
      "persists governed request identity and lifecycle",
      () => {
        expect(
          schema,
        ).toContain(
          "model ApprovalRequest",
        );


        expect(
          schema,
        ).toMatch(
          /requestType\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /status\s+String/,
        );


        expect(
          schema,
        ).toMatch(
          /requestedAt\s+DateTime/,
        );


        expect(
          schema,
        ).toMatch(
          /decidedAt\s+DateTime\?/,
        );
      },
    );


    it(
      "persists requester and approver attribution",
      () => {
        expect(
          schema,
        ).toMatch(
          /requestedByUserId\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /decidedByUserId\s+String\?/,
        );


        expect(
          schema,
        ).toContain(
          "ApprovalRequestRequester",
        );


        expect(
          schema,
        ).toContain(
          "ApprovalRequestDecider",
        );
      },
    );


    it(
      "persists approval rationale",
      () => {
        expect(
          schema,
        ).toMatch(
          /description\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /decisionNote\s+String\?/,
        );
      },
    );


    it(
      "supports generic governed entities",
      () => {
        expect(
          schema,
        ).toMatch(
          /subjectType\s+String\?/,
        );


        expect(
          schema,
        ).toMatch(
          /subjectId\s+String\?/,
        );
      },
    );
  },
);
