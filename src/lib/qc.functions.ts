import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  url: z.string().url().max(2048),
});

// QC image hosts commonly used by Chinese agents / Weidian / Taobao
const QC_HOST_PATTERNS = [
  /si\.geilicdn\.com/i,        // Weidian QC CDN
  /img\.alicdn\.com/i,         // Taobao
  /gd[0-9]?\.alicdn\.com/i,
  /img\.kakobuy\.com/i,
  /img\.cnfans\.com/i,
  /cnfans\.com\/.*qc/i,
  /qcphotos?\./i,
  /\/qc\//i,
  /pcitem\d+/i,                // Weidian item pattern
];

const REJECT_PATTERNS = [
  /logo|icon|avatar|favicon|sprite|placeholder|spinner|flag|banner|advert/i,
  /\.svg(\?|$)/i,
  /facebook|twitter|instagram|tiktok|youtube|pinterest|discord/i,
];

const isQcImage = (src: string): boolean => {
  if (!src || !/^https?:\/\//i.test(src)) return false;
  if (REJECT_PATTERNS.some((r) => r.test(src))) return false;
  if (!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(src)) return false;
  return QC_HOST_PATTERNS.some((r) => r.test(src));
};

const extractFromHtml = (html: string): string[] => {
  const out = new Set<string>();

  // <img src/data-src/srcset>
  const imgRe = /<img\b[^>]*>/gi;
  const attrRe = /\b(?:data-src|data-original|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i;
  const srcsetRe = /\bsrcset\s*=\s*["']([^"']+)["']/i;

  for (const tag of html.match(imgRe) ?? []) {
    const m = tag.match(attrRe);
    if (m && isQcImage(m[1])) out.add(m[1]);
    const ss = tag.match(srcsetRe);
    if (ss) {
      for (const part of ss[1].split(",")) {
        const u = part.trim().split(/\s+/)[0];
        if (isQcImage(u)) out.add(u);
      }
    }
  }

  // Any QC-host URL anywhere in the HTML/JSON payload
  const urlRe = /https?:\/\/[^\s"'<>()\\]+\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>()\\]*)?/gi;
  for (const u of html.match(urlRe) ?? []) {
    if (isQcImage(u)) out.add(u);
  }
  return Array.from(out);
};

export const findQcImages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return {
        success: false as const,
        error: "Firecrawl is not connected.",
        images: [] as string[],
      };
    }

    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: data.url,
          formats: ["html"],
          onlyMainContent: false,
          waitFor: 6000,
        }),
      });

      if (res.status === 402) {
        return {
          success: false as const,
          error: "Firecrawl: insufficient credits. Top up to keep searching.",
          images: [],
        };
      }

      const json: any = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false as const,
          error: json?.error || `Scrape failed (${res.status})`,
          images: [],
        };
      }

      const html: string = json?.data?.html ?? json?.html ?? "";
      const images = extractFromHtml(html);
      return { success: true as const, images, error: null };
    } catch (e) {
      return {
        success: false as const,
        error: e instanceof Error ? e.message : "Unknown error",
        images: [],
      };
    }
  });
