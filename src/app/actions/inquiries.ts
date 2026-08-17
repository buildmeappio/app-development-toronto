"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { inquiries, companies } from "@/db/schema";
import { sendEmail } from "@/lib/email";

// Abuse limits within a rolling hour.
const MAX_PER_IP_PER_HOUR = 5;
const MAX_PER_EMAIL_PER_HOUR = 3;

async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

async function countSince(field: "ipHash" | "email", value: string) {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(inquiries)
    .where(
      and(
        eq(inquiries[field], value),
        gt(inquiries.createdAt, sql`now() - interval '1 hour'`),
      ),
    );
  return row?.c ?? 0;
}

/** Public "request a call" lead capture — no auth. Honeypot + rate limited. */
export async function submitInquiryAction(formData: FormData) {
  // Honeypot: real users never see or fill this. Silently accept & drop.
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/upgrade?sent=1");
  }

  const val = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v.length ? v : null;
  };

  const contactName = val("contactName");
  const email = val("email");
  if (!contactName || !email) {
    throw new Error("Name and email are required.");
  }

  const ipHash = await clientIpHash();

  // Rate limit — over the cap, silently pretend success (no insert, no email)
  // so bots get no signal and we don't burn the mail quota.
  const [ipCount, emailCount] = await Promise.all([
    countSince("ipHash", ipHash),
    countSince("email", email),
  ]);
  if (ipCount >= MAX_PER_IP_PER_HOUR || emailCount >= MAX_PER_EMAIL_PER_HOUR) {
    redirect("/upgrade?sent=1");
  }

  const companyId = val("companyId");
  const phone = val("phone");
  const message = val("message");
  const interests = formData.getAll("interestedIn").map(String).filter(Boolean);
  const interestedIn = interests.join(", ") || "not specified";

  await db.insert(inquiries).values({
    companyId,
    contactName,
    email,
    phone,
    message,
    interestedIn: interests.join(",") || null,
    ipHash,
  });

  let companyName = "—";
  if (companyId) {
    const [c] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);
    if (c) companyName = c.name;
  }

  // Best-effort emails — never block the user on mail delivery.
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL;
  if (notifyTo) {
    await sendEmail({
      to: notifyTo,
      replyTo: email,
      subject: `New lead: ${contactName}${companyName !== "—" ? ` (${companyName})` : ""}`,
      html: `
        <h2>New "request a call" lead</h2>
        <table cellpadding="6" style="font-family:sans-serif;font-size:14px">
          <tr><td><strong>Name</strong></td><td>${contactName}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phone ?? "—"}</td></tr>
          <tr><td><strong>Company</strong></td><td>${companyName}</td></tr>
          <tr><td><strong>Interested in</strong></td><td>${interestedIn}</td></tr>
          <tr><td><strong>Message</strong></td><td>${message ?? "—"}</td></tr>
        </table>
        <p style="font-family:sans-serif;font-size:13px;color:#666">Reply directly to this email to reach ${contactName}.</p>
      `,
    });
  }

  await sendEmail({
    to: email,
    subject: "Thanks — we'll be in touch",
    html: `
      <div style="font-family:sans-serif;font-size:15px;color:#0f172a">
        <p>Hi ${contactName},</p>
        <p>Thanks for your interest in growing your visibility on <strong>Toronto App Developers</strong>. We've received your request${companyName !== "—" ? ` for <strong>${companyName}</strong>` : ""} and will reach out shortly to set things up and arrange payment.</p>
        <p>— The Toronto App Developers team</p>
      </div>
    `,
  });

  redirect("/upgrade?sent=1");
}
