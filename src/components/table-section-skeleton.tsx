export function TableSectionSkeleton() {
  return (
    <div className="animate-pulse space-y-2" aria-busy="true" aria-label="Loading table">
      <div className="h-4 w-40 rounded bg-surface-elevated" />
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="h-10 border-b border-border bg-surface-elevated" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-11 border-b border-border last:border-0" />
        ))}
      </div>
    </div>
  );
}
