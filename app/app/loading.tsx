/** Instant skeleton — menu clicks paint immediately while data loads. */
export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl" aria-busy="true" aria-label="Loading">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="skeleton h-9 w-64 rounded-2xl" />
          <div className="skeleton h-4 w-80 rounded-xl" />
        </div>
        <div className="skeleton h-10 w-40 rounded-full" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-10 w-10 rounded-2xl" />
            <div className="skeleton mt-4 h-7 w-16 rounded-xl" />
            <div className="skeleton mt-2 h-3 w-24 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <div className="card p-6">
          <div className="skeleton h-6 w-40 rounded-xl" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="skeleton h-64 w-full rounded-3xl" />
          <div className="card p-6">
            <div className="skeleton h-6 w-36 rounded-xl" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-9 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
