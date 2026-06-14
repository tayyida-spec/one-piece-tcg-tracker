/** Parsed YuYu-Tei retail listing row (JPY). */
export type YytParsedCard = {
  cardId: string;
  cardName: string;
  series: string;
  rarity: string;
  variant: string;
  priceJpy: number;
  yytProductId: string | null;
};

const OP16_SET = "OP16";
const OP16_URL = "https://yuyu-tei.jp/sell/opc/s/op16";

const SECTION_HEADER_RE =
  /<h3 class="text-primary fs-4 shadow fw-bold">[\s\S]*?<span[^>]*>([^<]+)<\/span>\s*Card List<\/h3>/g;

const PRODUCT_RE =
  /<span[^>]*class="d-block border border-dark p-1 w-100 text-center my-2"[^>]*>\s*([^<]*?)\s*<\/span>[\s\S]*?<h4 class="text-primary fw-bold">([^<]+)<\/h4>[\s\S]*?<strong[^>]*>\s*([\d,]+)\s*円[\s\S]*?<input[^>]*value="(\d+)"[^>]*class="cart_cid"/g;

export function parseVariantFromJapaneseName(name: string): string {
  if (name.includes("スーパーパラレル")) return "Super Parallel";
  if (name.includes("パラレル")) return "Parallel";
  return "";
}

export function parseSeriesFromCardId(cardId: string, fallback = OP16_SET): string {
  const match = cardId.match(/^([A-Za-z]+\d+)-/);
  return match ? match[1].toUpperCase() : fallback;
}

function normalizeCardId(rawId: string, yytProductId: string | null): string {
  const id = rawId.trim();
  if (id && id !== "-") return id.toUpperCase();
  if (yytProductId) return `DON-${yytProductId}`;
  return `DON-${id || "unknown"}`;
}

function parsePriceJpy(text: string): number {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function rarityAtPosition(headers: { pos: number; rarity: string }[], pos: number): string {
  let rarity = "";
  for (const header of headers) {
    if (header.pos <= pos) rarity = header.rarity;
    else break;
  }
  return rarity;
}

/**
 * Parse OP16 sell list HTML from YuYu-Tei.
 * Stops before the PICKUP carousel so unrelated cards are excluded.
 */
export function parseYuyuTeiOp16Html(html: string): YytParsedCard[] {
  const pickupIdx = html.indexOf("PICKUP");
  const slice = pickupIdx > 0 ? html.slice(0, pickupIdx) : html;

  const listStart = slice.indexOf('class="py-4 cards-list"');
  const main = listStart >= 0 ? slice.slice(listStart) : slice;

  const headers: { pos: number; rarity: string }[] = [];
  let headerMatch: RegExpExecArray | null;
  SECTION_HEADER_RE.lastIndex = 0;
  while ((headerMatch = SECTION_HEADER_RE.exec(main)) !== null) {
    headers.push({ pos: headerMatch.index, rarity: headerMatch[1].replace(/\s+/g, " ").trim() });
  }

  const cards: YytParsedCard[] = [];
  let productMatch: RegExpExecArray | null;
  PRODUCT_RE.lastIndex = 0;
  while ((productMatch = PRODUCT_RE.exec(main)) !== null) {
    const rawCardId = productMatch[1].trim();
    const cardName = productMatch[2].trim();
    const priceJpy = parsePriceJpy(productMatch[3]);
    const yytProductId = productMatch[4]?.trim() ?? null;
    const cardId = normalizeCardId(rawCardId, yytProductId);
    const rarity = rarityAtPosition(headers, productMatch.index);

    cards.push({
      cardId,
      cardName,
      series: parseSeriesFromCardId(cardId),
      rarity,
      variant: parseVariantFromJapaneseName(cardName),
      priceJpy,
      yytProductId,
    });
  }

  return cards;
}

export function jpyToSgd(jpy: number, rate: number): number {
  return Math.round(jpy * rate * 100) / 100;
}

export function getYytJpyToSgdRate(): number {
  const raw = process.env.YYT_JPY_TO_SGD?.trim();
  const rate = raw ? Number(raw) : 0.008;
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("YYT_JPY_TO_SGD must be a positive number (e.g. 0.008)");
  }
  return rate;
}

export { OP16_SET, OP16_URL };
