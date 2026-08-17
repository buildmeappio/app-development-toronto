// Approve (or reject) a pending profile claim.
// Usage:
//   npm run admin:approve -- <claim-id>
//   npm run admin:approve -- <claim-id> reject
import { db } from "./index";
import { claims, companies, profiles } from "./schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "../lib/email";

async function main() {
  const [, , claimId, action = "approve"] = process.argv;
  if (!claimId) {
    console.error("Usage: npm run admin:approve -- <claim-id> [reject]");
    process.exit(1);
  }
  const reject = action === "reject";

  const [claim] = await db
    .select({
      id: claims.id,
      companyId: claims.companyId,
      userEmail: profiles.email,
      companyName: companies.name,
      companySlug: companies.slug,
    })
    .from(claims)
    .innerJoin(companies, eq(claims.companyId, companies.id))
    .leftJoin(profiles, eq(claims.userId, profiles.id))
    .where(eq(claims.id, claimId))
    .limit(1);

  if (!claim) throw new Error(`Claim not found: ${claimId}`);

  if (reject) {
    await db.update(claims).set({ status: "rejected" }).where(eq(claims.id, claimId));
    // Only reset the company if no other approved claim exists.
    const [other] = await db
      .select({ id: claims.id })
      .from(claims)
      .where(and(eq(claims.companyId, claim.companyId), eq(claims.status, "approved")))
      .limit(1);
    if (!other) {
      await db.update(companies).set({ claimStatus: "unclaimed" }).where(eq(companies.id, claim.companyId));
    }
    console.log(`✗ Rejected claim for ${claim.companyName}.`);
    process.exit(0);
  }

  await db.update(claims).set({ status: "approved" }).where(eq(claims.id, claimId));
  await db.update(companies).set({ claimStatus: "claimed" }).where(eq(companies.id, claim.companyId));
  console.log(`✓ Approved ${claim.companyName} for ${claim.userEmail ?? "?"}.`);

  // Notify the rep + refresh the public page.
  if (claim.userEmail) {
    const res = await sendEmail({
      to: claim.userEmail,
      subject: `Your claim for ${claim.companyName} is approved`,
      html: `
        <div style="font-family:sans-serif;font-size:15px;color:#0f172a">
          <p>Good news — your claim for <strong>${claim.companyName}</strong> has been approved.</p>
          <p>You can now manage your profile:</p>
          <p><a href="https://appdevelopmenttoronto.com/company/${claim.companySlug}/edit">Edit your profile →</a></p>
        </div>`,
    });
    console.log(`  email: ${res.ok ? "sent" : "skipped (" + res.error + ")"}`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (siteUrl && secret) {
    await fetch(`${siteUrl}/api/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify({ paths: [`/company/${claim.companySlug}`] }),
    }).catch(() => {});
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
