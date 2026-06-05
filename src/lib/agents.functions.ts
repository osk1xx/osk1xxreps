import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard.server";

const adminKey = z.string().min(1).max(128);

// ---------------------------------------------------------------- public reads

export const listActiveAgents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("active", true)
    .order("recommended", { ascending: false })
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return { agents: data ?? [] };
});

// ----------------------------------------------------------------- admin reads

export const adminListAgents = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ adminKey }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { data: rows, error } = await supabaseAdmin
      .from("agents")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { agents: rows ?? [] };
  });

// -------------------------------------------------------------- admin mutations

export const adminCreateAgent = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ adminKey, name: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { data: row, error } = await supabaseAdmin
      .from("agents")
      .insert({ name: data.name })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { agent: row };
  });

export const adminUpdateAgent = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey,
        id: z.string().uuid(),
        name: z.string().min(1).max(120).optional(),
        logo_url: z.string().url().max(2000).nullable().optional(),
        register_url: z.string().max(2000).optional(),
        recommended: z.boolean().optional(),
        base: z.string().max(300).optional(),
        ref: z.string().max(64).optional(),
        platform_1688: z.string().max(16).optional(),
        platform_taobao: z.string().max(16).optional(),
        platform_weidian: z.string().max(16).optional(),
        promo_title_en: z.string().max(300).optional(),
        promo_body_en: z.string().max(3000).optional(),
        promo_title_pl: z.string().max(300).optional(),
        promo_body_pl: z.string().max(3000).optional(),
        promo_image_url: z.string().url().max(2000).nullable().optional(),
        sort: z.number().int().optional(),
        active: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { adminKey: _k, id, ...patch } = data;
    // Only one agent can be the recommended one at a time.
    if (patch.recommended === true) {
      await supabaseAdmin.from("agents").update({ recommended: false }).neq("id", id);
    }
    const { error } = await supabaseAdmin.from("agents").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteAgent = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ adminKey, id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { error } = await supabaseAdmin.from("agents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
