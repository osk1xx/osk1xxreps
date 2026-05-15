// Server-only helpers for scraping product pages.
// Extracts main image (og:image / first <img>) and a CNY (yuan) price.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function extractImage(html: string, baseUrl: string): string | null {
  const og =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (og?.[1]) return absolutize(og[1], baseUrl);
  const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (tw?.[1]) return absolutize(tw[1], baseUrl);
  const img = html.match(/<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp))[^"']*["']/i);
  if (img?.[1]) return absolutize(img[1], baseUrl);
  return null;
}

// Extracts a price in Chinese yuan (CNY). Tries the most reliable patterns first.
export function extractPriceCNY(html: string): number | null {
  const candidates: number[] = [];
  const push = (raw: string) => {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0 && n < 1_000_000) candidates.push(n);
  };

  // 1. Currency-symbol-prefixed patterns (most reliable)
  const symPatterns = [
    /¥\s*(\d+(?:[.,]\d+)?)/g,
    /￥\s*(\d+(?:[.,]\d+)?)/g,
    /(\d+(?:[.,]\d+)?)\s*元/g,
    /CNY\s*(\d+(?:[.,]\d+)?)/gi,
    /RMB\s*(\d+(?:[.,]\d+)?)/gi,
    /人民币\s*(\d+(?:[.,]\d+)?)/g,
  ];
  for (const re of symPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) push(m[1].replace(",", "."));
    if (candidates.length) return candidates[0];
  }

  // 2. JSON-style price keys
  const jsonPatterns = [
    /["']price["']\s*[:=]\s*["']?(\d+(?:\.\d+)?)/i,
    /["']salePrice["']\s*[:=]\s*["']?(\d+(?:\.\d+)?)/i,
    /["']shop_price["']\s*[:=]\s*["']?(\d+(?:\.\d+)?)/i,
    /["']current_price["']\s*[:=]\s*["']?(\d+(?:\.\d+)?)/i,
  ];
  for (const re of jsonPatterns) {
    const m = html.match(re);
    if (m?.[1]) {
      push(m[1]);
      if (candidates.length) return candidates[0];
    }
  }

  return null;
}

function absolutize(src: string, base: string): string {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}
