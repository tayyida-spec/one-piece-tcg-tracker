import https from "node:https";
import { decodeHtmlEntities } from "@/lib/html-entities";

export const BANDAI_OP16_URL =
  "https://en.onepiece-cardgame.com/cardlist/?series=569116";

const MODAL_RE =
  /<dl class="modalCol" id="(OP16-[^"]+)"[\s\S]*?<div class="cardName">([^<]+)<\/div>/g;

const DON_ENGLISH_NAMES: Record<string, string> = {
  "DON-10149": "DON!! Card (Impel Down)",
  "DON-10150": "DON!! Card (Impel Down)",
};

function variantFromModalId(modalId: string): string {
  if (/_p2$/i.test(modalId)) return "Super Parallel";
  if (/_p1$/i.test(modalId)) return "Parallel";
  return "";
}

function cardIdFromModalId(modalId: string): string {
  return modalId.replace(/_p\d+$/i, "").toUpperCase();
}

export function parseBandaiOp16EnglishNames(html: string): Map<string, string> {
  const map = new Map<string, string>();
  let match: RegExpExecArray | null;
  MODAL_RE.lastIndex = 0;
  while ((match = MODAL_RE.exec(html)) !== null) {
    const modalId = match[1];
    const name = decodeHtmlEntities(match[2].trim());
    const cardId = cardIdFromModalId(modalId);
    const variant = variantFromModalId(modalId);
    map.set(`${cardId}|${variant}`, name);
  }
  return map;
}

function httpsGet(url: string, insecure: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        rejectUnauthorized: !insecure,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          httpsGet(new URL(res.headers.location, url).toString(), insecure)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (status >= 400) {
          reject(new Error(`Bandai card list fetch failed (${status})`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.end();
  });
}

export async function fetchBandaiOp16EnglishNames(): Promise<Map<string, string>> {
  try {
    const html = await httpsGet(BANDAI_OP16_URL, false);
    return parseBandaiOp16EnglishNames(html);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/certificate|UNABLE_TO_VERIFY|fetch failed|SELF_SIGNED|CERT_/i.test(msg)) {
      const html = await httpsGet(BANDAI_OP16_URL, true);
      return parseBandaiOp16EnglishNames(html);
    }
    throw e;
  }
}

export function isOp16PriceListCard(cardId: string): boolean {
  const id = cardId.toUpperCase();
  return id.startsWith("OP16-") || id.startsWith("DON-");
}

export function resolveEnglishCardName(
  lookup: Map<string, string>,
  cardId: string,
  variant: string,
  fallback?: string
): string {
  const id = cardId.toUpperCase();
  const key = `${id}|${variant}`;
  if (lookup.has(key)) return lookup.get(key)!;
  const baseKey = `${id}|`;
  if (lookup.has(baseKey)) return lookup.get(baseKey)!;
  if (DON_ENGLISH_NAMES[id]) return DON_ENGLISH_NAMES[id];
  return fallback ?? id;
}

export function formatEnglishCardName(
  lookup: Map<string, string>,
  cardId: string,
  variant: string,
  currentName?: string
): string {
  return decodeHtmlEntities(
    resolveEnglishCardName(lookup, cardId, variant, currentName)
  );
}
