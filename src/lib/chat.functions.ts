import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard.server";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        body: z.string().trim().min(1).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("chat_messages").insert({
      browser_id: "contact",
      role: "user",
      email: data.email,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListMessages = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ adminKey: z.string().min(1).max(128) }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { data: rows, error } = await supabaseAdmin
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { messages: rows ?? [] };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey: z.string().min(1).max(128),
        id: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { error } = await supabaseAdmin
      .from("chat_messages")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
