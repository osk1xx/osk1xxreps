import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard.server";
import { extractPriceCNY, fetchPage } from "./scrape.server";
import { toAgentLink } from "./agent-link";

export const CATEGORIES = [
  "Shoes",
  "Hoodies",
  "T-Shirts",
  "Pants",
  "Accessories",
  "Belts",
  "Bags",
] as const;

const adminKey = z.string().min(1).max(128);

export const listApprovedProducts = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ category: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("products")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (data.category) q = q.eq("category", data.category);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { products: rows ?? [] };
  });

export const adminListProducts = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ adminKey }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { data: rows, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { products: rows ?? [] };
  });

export const adminCreateDraft = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey,
        category: z.string().min(1).max(64),
        name: z.string().min(1).max(200),
        url: z.string().url().max(2000),
        force: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    if (!data.force) {
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("id,name")
        .eq("source_url", data.url)
        .limit(1);
      if (existing && existing.length > 0) {
        return { duplicate: true as const, existing: existing[0] };
      }
    }
    let price_cny: number | null = null;
    // Scan both the agent page and the original seller page; keep the lowest price.
    const agentUrl = toAgentLink(data.url);
    const tryUrls = agentUrl !== data.url ? [agentUrl, data.url] : [data.url];
    for (const u of tryUrls) {
      const html = await fetchPage(u);
      if (!html) continue;
      const p = extractPriceCNY(html);
      if (p != null && (price_cny == null || p < price_cny)) price_cny = p;
    }
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert({
        category: data.category,
        name: data.name,
        source_url: data.url,
        image_url: null,
        price_cny,
        status: "draft",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { product: row };
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey,
        id: z.string().uuid(),
        category: z.string().min(1).max(64).optional(),
        name: z.string().min(1).max(200).optional(),
        image_url: z.string().url().nullable().optional(),
        price_cny: z.number().nullable().optional(),
        badge: z.enum(["best", "budget"]).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { adminKey: _k, id, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("products")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminApproveProduct = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ adminKey, id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { error } = await supabaseAdmin
      .from("products")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ adminKey, id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
