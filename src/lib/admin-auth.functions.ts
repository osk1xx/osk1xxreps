import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const ADMIN_EMAIL = "admin@osk1xx.local";
export const ADMIN_PASSWORD = "TwojeStaleHaslo123";

export const ensureAdminUser = createServerFn({ method: "POST" })
  .handler(async () => {
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (listErr) throw new Error(listErr.message);

    let userId = list.users.find((u) => u.email === ADMIN_EMAIL)?.id;

    if (!userId) {
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });

      if (cErr || !created.user) throw new Error(cErr?.message || "Failed to create admin");
      userId = created.user.id;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
      });
    }

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    if (roleErr) throw new Error(roleErr.message);

    return { ok: true };
  });
