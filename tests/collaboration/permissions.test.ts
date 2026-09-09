import {
  describe,
  expect,
  it,
} from "vitest";

import {
  hasWorkspacePermission,
  resolveProjectPermission,
} from "@/lib/workspaces/permissions";


describe(
  "workspace permission hierarchy",
  () => {
    it(
      "allows Owner to perform every workspace permission",
      () => {
        expect(
          hasWorkspacePermission(
            "OWNER",
            "OWNER",
          ),
        ).toBe(
          true,
        );

        expect(
          hasWorkspacePermission(
            "OWNER",
            "EDITOR",
          ),
        ).toBe(
          true,
        );

        expect(
          hasWorkspacePermission(
            "OWNER",
            "VIEWER",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "allows Editor to edit but not manage ownership",
      () => {
        expect(
          hasWorkspacePermission(
            "EDITOR",
            "EDITOR",
          ),
        ).toBe(
          true,
        );

        expect(
          hasWorkspacePermission(
            "EDITOR",
            "OWNER",
          ),
        ).toBe(
          false,
        );
      },
    );


    it(
      "keeps Viewer read-only",
      () => {
        expect(
          hasWorkspacePermission(
            "VIEWER",
            "VIEWER",
          ),
        ).toBe(
          true,
        );

        expect(
          hasWorkspacePermission(
            "VIEWER",
            "EDITOR",
          ),
        ).toBe(
          false,
        );
      },
    );
  },
);


describe(
  "project collaboration permission resolution",
  () => {
    it(
      "keeps personal project owners authoritative",
      () => {
        expect(
          resolveProjectPermission({
            userId:
              "owner",

            personalOwnerId:
              "owner",

            workspace:
              null,
          }),
        ).toBe(
          "OWNER",
        );
      },
    );


    it(
      "allows workspace owner access",
      () => {
        expect(
          resolveProjectPermission({
            userId:
              "workspace-owner",

            personalOwnerId:
              "different-owner",

            workspace: {
              ownerId:
                "workspace-owner",

              memberRole:
                null,
            },
          }),
        ).toBe(
          "OWNER",
        );
      },
    );


    it(
      "resolves workspace Editor and Viewer membership",
      () => {
        expect(
          resolveProjectPermission({
            userId:
              "editor",

            personalOwnerId:
              "owner",

            workspace: {
              ownerId:
                "workspace-owner",

              memberRole:
                "EDITOR",
            },
          }),
        ).toBe(
          "EDITOR",
        );


        expect(
          resolveProjectPermission({
            userId:
              "viewer",

            personalOwnerId:
              "owner",

            workspace: {
              ownerId:
                "workspace-owner",

              memberRole:
                "VIEWER",
            },
          }),
        ).toBe(
          "VIEWER",
        );
      },
    );


    it(
      "rejects unrelated users",
      () => {
        expect(
          resolveProjectPermission({
            userId:
              "outsider",

            personalOwnerId:
              "owner",

            workspace: {
              ownerId:
                "workspace-owner",

              memberRole:
                null,
            },
          }),
        ).toBeNull();
      },
    );
  },
);
