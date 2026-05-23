export default function AppLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-surface-elevated" />
        <div className="h-4 w-72 max-w-full rounded bg-surface-elevated" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-lg border border-border bg-surface" />
        ))}
      </div>
      <div className="h-64 rounded-lg border border-border bg-surface" />
      <div className="h-40 rounded-lg border border-border bg-surface" />
    </div>
  );
}
