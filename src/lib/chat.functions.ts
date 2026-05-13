import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const browserId = z.string().min(8).max(64).regex(/^[a-zA-Z0-9_-]+$/);

export const sendUserMessage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({ browserId, body: z.string().min(1).max(2000) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("chat_messages").insert({
      browser_id: data.browserId,
      role: "user",
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyMessages = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ browserId }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("chat_messages")
      .select("*")
      .eq("browser_id", data.browserId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { messages: rows ?? [] };
  });

export const adminListThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { messages: data ?? [] };
  });

export const adminReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ browserId, body: z.string().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("chat_messages").insert({
      browser_id: data.browserId,
      role: "admin",
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
