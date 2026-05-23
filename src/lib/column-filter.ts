/** Case-insensitive substring match; empty filter matches all rows. */
export function matchesColumnFilter(cellValue: string, filterText: string): boolean {
  const filter = filterText.trim().toLowerCase();
  if (!filter) return true;
  return cellValue.toLowerCase().includes(filter);
}
