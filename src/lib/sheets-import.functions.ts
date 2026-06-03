import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard.server";
import { readAllCandidates } from "./sheets-import.server";

const adminKey = z.string().min(1).max(128);

// Reads every configured sheet tab, filters to valid uidbuy products, and
// flags which ones already exist in the catalog (by source_url).
export const adminPreviewSheetImport = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ adminKey }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const candidates = await readAllCandidates();

    const urls = candidates.map((c) => c.url);
    const existing = new Set<string>();
    // Chunk the IN query to stay well under limits.
    for (let i = 0; i < urls.length; i += 200) {
      const chunk = urls.slice(i, i + 200);
      const { data: rows } = await supabaseAdmin
        .from("products")
        .select("source_url")
        .in("source_url", chunk);
      for (const r of rows ?? []) existing.add(r.source_url);
    }

    return {
      items: candidates.map((c) => ({ ...c, duplicate: existing.has(c.url) })),
    };
  });

const importItem = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  category: z.string().min(1).max(64),
  priceCny: z.number().nullable().optional(),
});

// Bulk-inserts selected candidates as drafts. Skips any url already present.
export const adminImportProducts = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ adminKey, items: z.array(importItem).min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);

    // Skip urls that already exist.
    const urls = data.items.map((i) => i.url);
    const existing = new Set<string>();
    for (let i = 0; i < urls.length; i += 200) {
      const chunk = urls.slice(i, i + 200);
      const { data: rows } = await supabaseAdmin
        .from("products")
        .select("source_url")
        .in("source_url", chunk);
      for (const r of rows ?? []) existing.add(r.source_url);
    }

    const toInsert = data.items
      .filter((i) => !existing.has(i.url))
      .map((i) => ({
        category: i.category,
        name: i.name,
        source_url: i.url,
        image_url: null,
        price_cny: i.priceCny ?? null,
        status: "draft" as const,
      }));

    if (toInsert.length === 0) return { inserted: 0, skipped: data.items.length };

    const { error } = await supabaseAdmin.from("products").insert(toInsert);
    if (error) throw new Error(error.message);
    return { inserted: toInsert.length, skipped: data.items.length - toInsert.length };
  });
