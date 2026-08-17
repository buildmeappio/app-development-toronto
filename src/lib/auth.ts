import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, claims, companies } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** The authenticated user (validated against Supabase), or null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Mirror the auth user into our profiles table (idempotent). */
export async function ensureProfile(user: { id: string; email?: string }) {
  if (!user.email) return;
  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email })
    .onConflictDoNothing();
}

/** Does this user have an approved claim on this company? */
export async function hasApprovedClaim(userId: string, companyId: string) {
  const [row] = await db
    .select({ id: claims.id })
    .from(claims)
    .where(
      and(
        eq(claims.companyId, companyId),
        eq(claims.userId, userId),
        eq(claims.status, "approved"),
      ),
    )
    .limit(1);
  return !!row;
}

/** Companies the user has claimed (approved) or has pending claims for. */
export async function getUserClaims(userId: string) {
  return db
    .select({
      claimId: claims.id,
      status: claims.status,
      domainMatched: claims.domainMatched,
      company: companies,
    })
    .from(claims)
    .innerJoin(companies, eq(claims.companyId, companies.id))
    .where(eq(claims.userId, userId));
}
