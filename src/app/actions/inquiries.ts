"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { inquiries } from "@/db/schema";

/** Public "request a call" lead capture — no auth required. */
export async function submitInquiryAction(formData: FormData) {
  const val = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v.length ? v : null;
  };

  const contactName = val("contactName");
  const email = val("email");
  if (!contactName || !email) {
    throw new Error("Name and email are required.");
  }

  const companyId = val("companyId");
  const interests = formData
    .getAll("interestedIn")
    .map(String)
    .filter(Boolean);

  await db.insert(inquiries).values({
    companyId,
    contactName,
    email,
    phone: val("phone"),
    message: val("message"),
    interestedIn: interests.join(",") || null,
  });

  redirect("/upgrade?sent=1");
}
