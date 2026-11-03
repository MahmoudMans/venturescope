import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspacesLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-5xl space-y-8 px-5 py-8 lg:px-8 lg:py-10"
    >
      <span className="sr-only">Loading workspaces</span>

      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />

        <Skeleton className="h-9 w-56 max-w-full" />

        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>

      <Skeleton className="h-36 rounded-xl" />

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />

        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
