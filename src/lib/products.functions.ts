import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { extractImage, extractPriceCNY, fetchPage } from "./scrape.server";

export const CATEGORIES = [
  "Shoes",
  "Hoodies",
  "T-Shirts",
  "Pants",
  "Accessories",
  "Belts",
  "Bags",
] as const;

export const listApprovedProducts = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({ category: z.string().optional() })
      .parse(input ?? {}),
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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { products: data ?? [] };
  });

export const adminCreateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        category: z.string().min(1).max(64),
        name: z.string().min(1).max(200),
        url: z.string().url().max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    let image_url: string | null = null;
    let price_cny: number | null = null;
    const html = await fetchPage(data.url);
    if (html) {
      image_url = extractImage(html, data.url);
      price_cny = extractPriceCNY(html);
    }
    const { data: row, error } = await context.supabase
      .from("products")
      .insert({
        category: data.category,
        name: data.name,
        source_url: data.url,
        image_url,
        price_cny,
        status: "draft",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { product: row };
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        category: z.string().min(1).max(64).optional(),
        name: z.string().min(1).max(200).optional(),
        image_url: z.string().url().nullable().optional(),
        price_cny: z.number().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("products")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminApproveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("products")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
