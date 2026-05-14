// Server-only admin guard. Static credential check used by all admin server functions.
const ADMIN_PASSWORD = "repslove2102";

export function assertAdmin(key: string | undefined | null) {
  if (!key || key !== ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }
}
