import { formatDistanceToNowStrict } from "date-fns";

/** Days after which a market price is considered stale on the dashboard. */
export const MARKET_PRICE_STALE_DAYS = 14;

export type PriceFreshness = {
  label: string;
  stale: boolean;
  daysAgo: number | null;
};

export function priceFreshness(updatedAt: string | Date | null | undefined): PriceFreshness | null {
  if (!updatedAt) return null;
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return null;

  const ms = Date.now() - d.getTime();
  const daysAgo = Math.floor(ms / (1000 * 60 * 60 * 24));
  const stale = daysAgo >= MARKET_PRICE_STALE_DAYS;

  let label: string;
  if (daysAgo <= 0) {
    label = "today";
  } else if (daysAgo === 1) {
    label = "1 day ago";
  } else if (daysAgo < 14) {
    label = `${daysAgo} days ago`;
  } else {
    label = formatDistanceToNowStrict(d, { addSuffix: true });
  }

  return { label, stale, daysAgo };
}
