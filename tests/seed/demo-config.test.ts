import { describe, expect, it } from "vitest";

import { registerSchema } from "@/lib/validation/auth";
import {
  checkSeedTarget,
  DEMO_ACTUAL_MONTHS,
  DEMO_CLOSED_MONTHS,
  DEMO_PASSWORD,
  DEMO_PEOPLE,
  DEMO_PERSON_KEYS,
  demoModelName,
  demoTimeline,
} from "@/scripts/seed/demo-config";

const check = (databaseUrl: string, nodeEnv?: string, allowRemote?: string) =>
  checkSeedTarget({ databaseUrl, nodeEnv, allowRemote });

const LOCAL = "postgresql://venturescope:secret@localhost:5438/venturescope";

const REMOTE = "postgresql://user:topsecret@db.example.com:5432/venturescope";

describe("the demo accounts", () => {
  it("are three people with three roles, on an address that can never be a real mailbox", () => {
    const emails = DEMO_PERSON_KEYS.map((key) => DEMO_PEOPLE[key].email);

    expect(new Set(emails).size).toBe(3);

    expect(DEMO_PERSON_KEYS.map((key) => DEMO_PEOPLE[key].role)).toEqual([
      "OWNER",
      "EDITOR",
      "VIEWER",
    ]);

    for (const email of emails) {
      expect(email.endsWith("@venturescope.test")).toBe(true);
    }
  });

  it("are accepted by the rules of the Register form", () => {
    for (const key of DEMO_PERSON_KEYS) {
      const person = DEMO_PEOPLE[key];

      const result = registerSchema.safeParse({
        name: person.name,
        email: person.email,
        password: DEMO_PASSWORD,
        confirmPassword: DEMO_PASSWORD,
      });

      expect(result.success, person.email).toBe(true);
    }
  });
});

describe("the timeline of the demo", () => {
  it("has 9 months that follow each other, the first 6 closed, ending before the month that runs", () => {
    for (const day of ["2026-10-23T10:00:00Z", "2026-12-31T23:59:00Z", "2028-02-29T12:00:00Z"]) {
      const timeline = demoTimeline(new Date(day));

      const numbers = timeline.actualMonths.map((month) => {
        const [year, number] = month.split("-").map(Number);

        return year * 12 + number;
      });

      expect(numbers).toHaveLength(DEMO_ACTUAL_MONTHS);

      numbers.slice(1).forEach((value, index) => expect(value, day).toBe(numbers[index] + 1));

      expect(timeline.closedMonths).toEqual(timeline.actualMonths.slice(0, DEMO_CLOSED_MONTHS));

      expect(timeline.latestActualMonth).toBe(timeline.actualMonths[8]);

      expect(timeline.latestActualMonth < timeline.currentMonth, day).toBe(true);
    }
  });

  it("starts nine months before the month of the run, also over a new year", () => {
    expect(demoTimeline(new Date("2026-10-23T10:00:00Z")).startMonth).toBe("2026-01");

    const later = demoTimeline(new Date("2027-03-15T12:00:00Z"));

    expect([later.startMonth, later.latestActualMonth]).toEqual(["2026-06", "2027-02"]);

    expect(demoModelName(later.startMonth)).toBe("Orbit Analytics 2026 plan");
  });
});

describe("the safety rule of the seed", () => {
  it("allows a database on this computer", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]", "host.docker.internal"]) {
      expect(check(`postgresql://u:p@${host}:5438/db`).ok, host).toBe(true);
    }
  });

  it("stops on another computer, on production, on a bad address and on a name that only looks local", () => {
    expect(check(REMOTE).ok).toBe(false);

    expect(check(LOCAL, "production").ok).toBe(false);

    for (const url of [
      "",
      "not a url",
      "localhost",
      "postgresql://u:p@localhost.evil.example/db",
    ]) {
      expect(check(url).ok, url).toBe(false);
    }
  });

  it("goes on only when the answer is exactly yes", () => {
    for (const answer of ["true", "1", "YES", "y", ""]) {
      expect(check(REMOTE, undefined, answer).ok, answer).toBe(false);
    }

    expect(check(REMOTE, "production", "yes").ok).toBe(true);
  });

  it("says why it stopped, with the way to go on, and never shows the password", () => {
    const result = check(REMOTE);

    if (result.ok) {
      throw new Error("It should have stopped.");
    }

    expect(result.reason).toContain("VS_SEED_ALLOW_REMOTE=yes");

    expect(result.reason.includes("topsecret")).toBe(false);

    expect([result.host, result.remote]).toEqual(["db.example.com", true]);
  });
});
