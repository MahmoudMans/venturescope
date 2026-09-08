"use client";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  buildProjectWorkspaceNavigation,
} from "@/lib/projects/workspace-navigation";
import {
  cn,
} from "@/lib/utils";

export function ProjectWorkspaceNav({
  projectId,
}: {
  projectId: string;
}) {
  const pathname =
    usePathname();

  const groups =
    buildProjectWorkspaceNavigation(
      projectId,
    );

  return (
    <nav
      aria-label="Project workspace"
      className="space-y-6"
    >
      {groups.map(
        (
          group,
        ) => (
          <div
            key={
              group.label
            }
          >
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {
                group.label
              }
            </div>

            <div className="space-y-1">
              {group.items.map(
                (
                  item,
                ) => {
                  const active =
                    pathname ===
                    item.href;

                  const Icon =
                    item.icon;

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "hover:bg-muted",
                      )}
                    >
                      <Icon
                        className="size-4"
                        aria-hidden="true"
                      />

                      {
                        item.label
                      }
                    </Link>
                  );
                },
              )}
            </div>
          </div>
        ),
      )}
    </nav>
  );
}
