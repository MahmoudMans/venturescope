export default function ForecastAccuracyLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl animate-pulse space-y-6 px-5 py-8 lg:px-8">
      <div className="h-9 w-72 rounded bg-muted" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {
          Array.from({
            length:
              4,
          }).map(
            (
              _,
              index,
            ) => (
              <div
                key={
                  index
                }
                className="h-28 rounded-xl bg-muted"
              />
            ),
          )
        }
      </div>

      <div className="h-72 rounded-xl bg-muted" />
    </main>
  );
}
