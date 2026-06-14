import {
  getYytJpyToSgdRate,
  jpyToSgd,
  OP16_URL,
  parseYuyuTeiOp16Html,
  type YytParsedCard,
} from "@/lib/yuyu-tei-parser";
import https from "node:https";

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "ja,en;q=0.9",
  Accept: "text/html,application/xhtml+xml",
};

function isTlsError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  const code = e && typeof e === "object" && "code" in e ? String(e.code) : "";
  return /certificate|UNABLE_TO_VERIFY|fetch failed|SELF_SIGNED|CERT_/i.test(`${msg} ${code}`);
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
        headers: FETCH_HEADERS,
        rejectUnauthorized: !insecure,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).toString();
          httpsGet(next, insecure).then(resolve).catch(reject);
          return;
        }
        if (status >= 400) {
          reject(new Error(`YuYu-Tei fetch failed (${status})`));
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

export async function fetchYuyuTeiOp16Html(url = OP16_URL): Promise<string> {
  try {
    return await httpsGet(url, false);
  } catch (e) {
    if (isTlsError(e)) {
      return httpsGet(url, true);
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}

export async function fetchYuyuTeiOp16Cards(url = OP16_URL): Promise<YytParsedCard[]> {
  const html = await fetchYuyuTeiOp16Html(url);
  const cards = parseYuyuTeiOp16Html(html);
  if (cards.length === 0) {
    throw new Error("No cards parsed from YuYu-Tei — the page layout may have changed");
  }
  return cards;
}

export function convertYytCardsToSgd(
  cards: YytParsedCard[],
  rate = getYytJpyToSgdRate()
): Array<YytParsedCard & { priceSgd: number }> {
  return cards.map((card) => ({
    ...card,
    priceSgd: jpyToSgd(card.priceJpy, rate),
  }));
}
