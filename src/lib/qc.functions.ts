import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  url: z.string().url().max(2048),
});

// Strip resizing query params so we get full-size QC photos
const stripResize = (u: string) =>
  u.replace(/([?&])x-oss-process=[^&]*/i, "").replace(/[?&]$/, "");

const REJECT = /(logo|icon|avatar|favicon|sprite|placeholder|spinner|flag|banner|advert|qrcode)/i;

const extractImagesFromBlock = (block: string): string[] => {
  const out = new Set<string>();
  const attrRe = /\b(?:data-src|data-original|data-lazy-src|src)\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(block)) !== null) {
    const u = m[1];
    if (!/^https?:\/\//i.test(u)) continue;
    if (!/\.(jpe?g|png|webp|avif)/i.test(u)) continue;
    if (REJECT.test(u)) continue;
    out.add(stripResize(u));
  }
  return Array.from(out);
};

// Find the contents of <div class="product-qc-images-main"> ... </div>, balanced.
const findQcBlock = (html: string): string | null => {
  const re = /<div[^>]*class="[^"]*product-qc-images-main[^"]*"[^>]*>/i;
  const m = html.match(re);
  if (!m || m.index === undefined) return null;
  const start = m.index + m[0].length;
  // Walk and balance <div> tags
  let depth = 1;
  let i = start;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = i;
  let t: RegExpExecArray | null;
  while ((t = tagRe.exec(html)) !== null) {
    if (t[0].startsWith("</")) {
      depth--;
      if (depth === 0) return html.slice(start, t.index);
    } else {
      depth++;
    }
  }
  return html.slice(start);
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
          error: "Firecrawl: insufficient credits.",
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
      const block = findQcBlock(html);
      if (!block) {
        return {
          success: true as const,
          images: [],
          error: null,
        };
      }
      const images = extractImagesFromBlock(block);
      return { success: true as const, images, error: null };
    } catch (e) {
      return {
        success: false as const,
        error: e instanceof Error ? e.message : "Unknown error",
        images: [],
      };
    }
  });
