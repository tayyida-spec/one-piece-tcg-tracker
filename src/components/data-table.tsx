import { cn } from "@/lib/utils";

export function DataTable({
  headers,
  children,
  emptyMessage,
  preserveHeaderCase = false,
}: {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  preserveHeaderCase?: boolean;
}) {
  const isEmpty = !children;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="table-header-accent min-w-full text-left text-sm">
        <thead className="bg-surface-elevated text-muted">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-xs font-medium",
                  !preserveHeaderCase && "uppercase text-muted-foreground"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
      {isEmpty && emptyMessage ? (
        <p className="px-4 py-8 text-center text-sm text-muted">{emptyMessage}</p>
      ) : null}
    </div>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-3 py-2 align-top text-foreground", className)}>{children}</td>;
}
