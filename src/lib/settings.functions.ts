import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard.server";

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
  };
});

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        adminKey: z.string().min(1).max(128),
        disable_products: z.boolean().optional(),
        critical_alert: z.boolean().optional(),
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
