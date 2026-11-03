import { cn } from "@/lib/utils";

/** Consistent heading block for account and collaboration pages. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-col justify-between gap-4 sm:flex-row sm:items-end", className)}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>

        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">{actions}</div>
      ) : null}
    </header>
  );
}
