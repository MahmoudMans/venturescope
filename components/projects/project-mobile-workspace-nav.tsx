"use client";

import {
  ChevronDown,
  Menu,
} from "lucide-react";
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

export function ProjectMobileWorkspaceNav({
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

  const current =
    groups
      .flatMap(
        (
          group,
        ) =>
          group.items,
      )
      .find(
        (
          item,
        ) =>
          item.href ===
          pathname,
      );

  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg border bg-background px-3 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Menu
          className="size-4"
          aria-hidden="true"
        />

        <span className="min-w-0 flex-1 truncate">
          {
            current?.label ??
            "Project navigation"
          }
        </span>

        <ChevronDown
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <nav
        aria-label="Mobile project workspace"
        className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-[70svh] overflow-y-auto rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl"
      >
        {groups.map(
          (
            group,
          ) => (
            <div
              key={
                group.label
              }
              className="mb-4 last:mb-0"
            >
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
                          "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                          active
                            ? "bg-foreground font-medium text-background"
                            : "hover:bg-muted",
                        )}
                      >
                        <Icon
                          className="size-4 shrink-0"
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
    </details>
  );
}
