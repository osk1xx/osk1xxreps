import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard.server";

const adminKey = z.string().min(1).max(128);
const photos = z.array(z.string().url().max(2000)).max(30);

// ---------------------------------------------------------------- public reads

export const listPublishedTutorials = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ language: z.enum(["en", "pl"]).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("tutorials")
      .select("id,title,description,language,sort")
      .eq("published", true)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false });
    if (data.language) q = q.eq("language", data.language);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { tutorials: rows ?? [] };
  });

export const getTutorial = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: tut, error } = await supabaseAdmin
      .from("tutorials")
      .select("*")
      .eq("id", data.id)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!tut) return { tutorial: null, steps: [] };
    const { data: steps, error: e2 } = await supabaseAdmin
      .from("tutorial_steps")
      .select("*")
      .eq("tutorial_id", data.id)
      .order("position", { ascending: true });
    if (e2) throw new Error(e2.message);
    return { tutorial: tut, steps: steps ?? [] };
  });

// ----------------------------------------------------------------- admin reads

export const adminListTutorials = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ adminKey }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { data: rows, error } = await supabaseAdmin
      .from("tutorials")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { tutorials: rows ?? [] };
  });

export const adminGetTutorialSteps = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ adminKey, tutorialId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { data: steps, error } = await supabaseAdmin
      .from("tutorial_steps")
      .select("*")
      .eq("tutorial_id", data.tutorialId)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return { steps: steps ?? [] };
  });

// -------------------------------------------------------------- admin mutations

export const adminCreateTutorial = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey,
        language: z.enum(["en", "pl"]),
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { data: row, error } = await supabaseAdmin
      .from("tutorials")
      .insert({
        language: data.language,
        title: data.title,
        description: data.description ?? null,
        published: false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { tutorial: row };
  });

export const adminUpdateTutorial = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey,
        id: z.string().uuid(),
        language: z.enum(["en", "pl"]).optional(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).nullable().optional(),
        published: z.boolean().optional(),
        sort: z.number().int().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { adminKey: _k, id, ...patch } = data;
    const { error } = await supabaseAdmin.from("tutorials").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteTutorial = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ adminKey, id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { error } = await supabaseAdmin.from("tutorials").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreateStep = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey,
        tutorialId: z.string().uuid(),
        position: z.number().int().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { data: row, error } = await supabaseAdmin
      .from("tutorial_steps")
      .insert({
        tutorial_id: data.tutorialId,
        position: data.position ?? 0,
        name: "",
        text: "",
        photos: [],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { step: row };
  });

export const adminUpdateStep = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey,
        id: z.string().uuid(),
        name: z.string().max(200).optional(),
        text: z.string().max(5000).optional(),
        photos: photos.optional(),
        link_url: z.string().url().max(2000).or(z.literal("")).optional(),
        link_label: z.string().max(100).optional(),
        position: z.number().int().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { adminKey: _k, id, ...patch } = data;
    const { error } = await supabaseAdmin.from("tutorial_steps").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteStep = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ adminKey, id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { error } = await supabaseAdmin.from("tutorial_steps").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
