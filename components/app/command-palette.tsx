"use client";

import { BriefcaseBusiness, CornerDownLeft, FileText, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { confirmDiscardChanges } from "@/lib/forms/leave-guard";
import { cn } from "@/lib/utils";

export type CommandPaletteItem = {
  id: string;
  label: string;
  hint: string;
  href: string;
  kind: "page" | "model";
};

export function CommandPalette({ items }: { items: CommandPaletteItem[] }) {
  const router = useRouter();

  const listId = React.useId();

  const [open, setOpen] = React.useState(false);

  const [query, setQuery] = React.useState("");

  const [activeIndex, setActiveIndex] = React.useState(0);

  const results = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (needle === "") {
      return items;
    }

    return items.filter((item) =>
      `${item.label} ${item.hint} ${item.kind}`.toLowerCase().includes(needle),
    );
  }, [items, query]);

  const safeIndex = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1);

  const changeOpen = React.useCallback((next: boolean) => {
    setOpen(next);

    setQuery("");

    setActiveIndex(0);
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        changeOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [changeOpen]);

  React.useEffect(() => {
    if (open === false || safeIndex < 0) {
      return;
    }

    document.getElementById(`${listId}-option-${safeIndex}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [open, safeIndex, listId]);

  function go(item: CommandPaletteItem) {
    // A form with changes that are not saved asks first. The list stays open when the person stays.
    if (confirmDiscardChanges() === false) {
      return;
    }

    changeOpen(false);

    router.push(item.href);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (results.length > 0) {
        setActiveIndex((safeIndex + 1) % results.length);
      }

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (results.length > 0) {
        setActiveIndex((safeIndex - 1 + results.length) % results.length);
      }

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const item = results[safeIndex];

      if (item) {
        go(item);
      }
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => changeOpen(true)}
        aria-keyshortcuts="Control+K Meta+K"
        className="hidden w-64 justify-start gap-2 font-normal text-muted-foreground md:inline-flex lg:w-72"
      >
        <Search className="size-4" aria-hidden="true" />

        <span className="flex-1 text-left">Search models and pages</span>

        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => changeOpen(true)}
        aria-label="Search models and pages"
      >
        <Search className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent
          showCloseButton={false}
          placement="top"
          className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>

          <DialogDescription className="sr-only">
            Jump to a financial model or page. Use the arrow keys to move and Enter to open.
          </DialogDescription>

          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

            <input
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={safeIndex >= 0 ? `${listId}-option-${safeIndex}` : undefined}
              aria-label="Search models and pages"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);

                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search models and pages…"
              autoComplete="off"
              spellCheck={false}
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ul
            id={listId}
            role="listbox"
            aria-label="Results"
            className="max-h-[min(20rem,30svh)] overflow-y-auto p-2 sm:max-h-[min(20rem,calc(100svh-10rem))]"
          >
            {results.length === 0 ? (
              <li
                role="presentation"
                className="px-3 py-10 text-center text-sm text-muted-foreground"
              >
                No matching models or pages.
              </li>
            ) : (
              results.map((item, index) => {
                const active = index === safeIndex;

                const Icon = item.kind === "model" ? BriefcaseBusiness : FileText;

                return (
                  <li
                    key={item.id}
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={active}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => go(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
                      active && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-medium">{item.label}</span>

                      <span className="block break-words text-xs text-muted-foreground">
                        {item.hint}
                      </span>
                    </span>

                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {item.kind}
                    </span>
                  </li>
                );
              })
            )}
          </ul>

          <div className="hidden items-center justify-between gap-3 border-t bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground sm:flex">
            <span>↑ ↓ to navigate</span>

            <span className="flex items-center gap-1">
              <CornerDownLeft className="size-3" aria-hidden="true" />
              to open · Esc to close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
