import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
  normalizeInvitationEmail,
} from "@/lib/workspaces/invitations";


describe(
  "workspace invitations",
  () => {
    it(
      "normalizes invitation email addresses",
      () => {
        expect(
          normalizeInvitationEmail(
            " Person@Example.COM ",
          ),
        ).toBe(
          "person@example.com",
        );
      },
    );


    it(
      "generates high-entropy invitation tokens",
      () => {
        const first =
          createInvitationToken();

        const second =
          createInvitationToken();


        expect(
          first.length,
        ).toBeGreaterThan(
          32,
        );

        expect(
          first,
        ).not.toBe(
          second,
        );
      },
    );


    it(
      "stores only deterministic token hashes",
      () => {
        const token =
          "private-invitation-token";


        const hash =
          hashInvitationToken(
            token,
          );


        expect(
          hash,
        ).toHaveLength(
          64,
        );

        expect(
          hash,
        ).not.toContain(
          token,
        );
      },
    );


    it(
      "expires invitations seven days later",
      () => {
        const start =
          new Date(
            "2026-09-08T12:00:00.000Z",
          );


        expect(
          invitationExpiry(
            start,
          ).toISOString(),
        ).toBe(
          "2026-09-15T12:00:00.000Z",
        );
      },
    );
  },
);
