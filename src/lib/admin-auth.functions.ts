import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Maps the admin "username" to a stable internal email.
export const ADMIN_EMAIL = "admin@osk1xx.local";

// Bootstraps the admin user on first call. Idempotent.
// Creates the auth user (if missing) with the given password, and assigns the admin role.
export const ensureAdminUser = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ password: z.string().min(6).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    // List users and find one matching email
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);

    let userId = list.users.find((u) => u.email === ADMIN_EMAIL)?.id;

    if (!userId) {
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: data.password,
        email_confirm: true,
      });
      if (cErr || !created.user) throw new Error(cErr?.message || "Failed to create admin");
      userId = created.user.id;
    } else {
      // Make sure password is set/refreshed so login works
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: data.password });
    }

    // Assign admin role if not present
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true };
  });
