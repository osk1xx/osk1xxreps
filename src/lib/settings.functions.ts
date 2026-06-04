import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard.server";
import { normalizeAgentConfig } from "./agent-link";

export const getAppSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return {
    disable_products: !!data.disable_products,
    critical_alert: !!data.critical_alert,
    agent_config: normalizeAgentConfig(data.agent_config),
  };
});

const agentConfigSchema = z.object({
  base: z.string().url().max(300),
  ref: z.string().min(1).max(64),
  platforms: z.object({
    "1688": z.string().min(1).max(16),
    taobao: z.string().min(1).max(16),
    weidian: z.string().min(1).max(16),
  }),
});

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey: z.string().min(1).max(128),
        disable_products: z.boolean().optional(),
        critical_alert: z.boolean().optional(),
        agent_config: agentConfigSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminKey);
    const { adminKey: _k, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("app_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
