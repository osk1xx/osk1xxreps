import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  url: z.string().url().max(2048),
});

const TARGET = "https://www.tymixfinds.pl/qc-finder";

const isLikelyQcImage = (src: string) => {
  if (!src) return false;
  const s = src.toLowerCase();
  if (!/^https?:\/\//.test(s)) return false;
  if (s.startsWith("data:")) return false;
  if (/(logo|icon|avatar|favicon|sprite|placeholder|loading|spinner|flag)/.test(s)) return false;
  if (/\.svg(\?|$)/.test(s)) return false;
  if (/(facebook|twitter|instagram|tiktok|youtube|pinterest)/.test(s)) return false;
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/.test(s) || /image|img|photo|qc|cdn/.test(s);
};

const extractImages = (html: string): string[] => {
  const out = new Set<string>();
  const imgRe = /<img\b[^>]*>/gi;
  const srcRe = /\b(?:data-src|data-original|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i;
  const srcsetRe = /\bsrcset\s*=\s*["']([^"']+)["']/i;

  for (const tag of html.match(imgRe) ?? []) {
    const m = tag.match(srcRe);
    if (m && isLikelyQcImage(m[1])) out.add(m[1]);
    const ss = tag.match(srcsetRe);
    if (ss) {
      for (const part of ss[1].split(",")) {
        const u = part.trim().split(/\s+/)[0];
        if (isLikelyQcImage(u)) out.add(u);
      }
    }
  }
  // Fallback: scrape any image URL anywhere in HTML
  const urlRe = /https?:\/\/[^\s"'<>()]+\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>()]*)?/gi;
  for (const u of html.match(urlRe) ?? []) {
    if (isLikelyQcImage(u)) out.add(u);
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
        error:
          "Firecrawl is not connected. Connect the Firecrawl connector in Lovable to enable QC scraping.",
        images: [] as string[],
      };
    }

    try {
      // Use Firecrawl actions to: navigate target, fill the input, click search, wait for images.
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: TARGET,
          formats: ["html"],
          onlyMainContent: false,
          waitFor: 2000,
          actions: [
            { type: "wait", milliseconds: 1500 },
            { type: "write", text: data.url, selector: "input" },
            { type: "press", key: "Enter" },
            { type: "wait", milliseconds: 10000 },
            { type: "scrape" },
          ],
        }),
      });

      if (res.status === 402) {
        return {
          success: false as const,
          error: "Firecrawl: insufficient credits. Top up or upgrade your plan.",
          images: [],
        };
      }

      const json: any = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false as const,
          error: json?.error || `Firecrawl error (${res.status})`,
          images: [],
        };
      }

      const html: string =
        json?.data?.html ??
        json?.html ??
        json?.data?.actions?.scrapes?.[0]?.html ??
        "";

      const images = extractImages(html);
      return { success: true as const, images, error: null };
    } catch (e) {
      return {
        success: false as const,
        error: e instanceof Error ? e.message : "Unknown error",
        images: [],
      };
    }
  });
