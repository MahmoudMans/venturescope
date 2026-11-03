import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-3xl space-y-6 px-5 py-8 lg:px-8 lg:py-10"
    >
      <span className="sr-only">Loading account</span>

      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />

        <Skeleton className="h-9 w-48 max-w-full" />

        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <Skeleton className="h-56 rounded-xl" />

      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
