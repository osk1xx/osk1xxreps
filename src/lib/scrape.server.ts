// Server-only helpers for scraping product pages.
// Extracts main image (og:image / first <img>) and a CNY price.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en,zh;q=0.8",
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

export function extractPriceCNY(html: string): number | null {
  const patterns = [
    /["']?price["']?\s*[:=]\s*["']?(\d+(?:\.\d+)?)/i,
    /¥\s*(\d+(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)\s*元/,
    /CNY\s*(\d+(?:\.\d+)?)/i,
    /RMB\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (!Number.isNaN(n) && n > 0 && n < 1_000_000) return n;
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
