import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceDetailLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-4xl space-y-6 px-5 py-8 lg:px-8 lg:py-10"
    >
      <span className="sr-only">Loading workspace</span>

      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />

        <Skeleton className="h-4 w-20" />

        <Skeleton className="h-9 w-64 max-w-full" />

        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <Skeleton className="h-48 rounded-xl" />

      <Skeleton className="h-56 rounded-xl" />

      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
