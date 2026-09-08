import {
  Skeleton,
} from "@/components/ui/skeleton";

export default function DemoLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto min-h-svh max-w-[1600px] space-y-8 px-5 py-10 lg:px-8"
    >
      <span className="sr-only">
        Loading VentureScope demo
      </span>

      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-14 w-[46rem] max-w-full" />
      <Skeleton className="h-5 w-[38rem] max-w-full" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({
          length:
            6,
        }).map(
          (
            _,
            index,
          ) => (
            <Skeleton
              key={
                index
              }
              className="h-32 rounded-xl"
            />
          ),
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-[360px] rounded-xl" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
    </main>
  );
}
