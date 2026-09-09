import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseDecisionDueDate,
  parseDecisionPriority,
  parseDecisionSourceCode,
  parseDecisionStatus,
} from "@/lib/finance/decision-center/validation";


describe(
  "management action validation",
  () => {
    it(
      "validates priority and status",
      () => {
        expect(
          parseDecisionPriority(
            "CRITICAL",
          ),
        ).toBe(
          "CRITICAL",
        );


        expect(
          parseDecisionStatus(
            "IN_PROGRESS",
          ),
        ).toBe(
          "IN_PROGRESS",
        );
      },
    );


    it(
      "validates signal source codes",
      () => {
        expect(
          parseDecisionSourceCode(
            "CAPITAL_GAP",
          ),
        ).toBe(
          "CAPITAL_GAP",
        );
      },
    );


    it(
      "normalizes due dates to UTC",
      () => {
        expect(
          parseDecisionDueDate(
            "2027-05-06",
          )?.toISOString(),
        ).toBe(
          "2027-05-06T00:00:00.000Z",
        );
      },
    );


    it(
      "allows blank due dates",
      () => {
        expect(
          parseDecisionDueDate(
            "",
          ),
        ).toBeNull();
      },
    );
  },
);
