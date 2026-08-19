import { getCurrentUser } from "./auth";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/** The current user if they're an admin, else null. */
export async function getAdminUser() {
  const user = await getCurrentUser();
  return isAdminEmail(user?.email) ? user : null;
}

/** Guard for admin server actions — throws if the caller isn't an admin. */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error("Not authorized.");
  return user;
}
