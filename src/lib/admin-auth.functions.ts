import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Static admin credentials
const ADMIN_USERNAME = "adminosk";
const ADMIN_PASSWORD = "Andzis<3";

// Validates admin credentials
export const validateAdminCredentials = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ 
      username: z.string().min(1),
      password: z.string().min(1)
    }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.username === ADMIN_USERNAME && data.password === ADMIN_PASSWORD) {
      return { ok: true, valid: true };
    }
    return { ok: true, valid: false };
  });
