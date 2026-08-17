// View "request a call" leads. Run: npm run admin:inquiries
import { db } from "./index";
import { inquiries, companies } from "./schema";
import { eq, desc } from "drizzle-orm";

async function main() {
  const rows = await db
    .select({ i: inquiries, companyName: companies.name })
    .from(inquiries)
    .leftJoin(companies, eq(inquiries.companyId, companies.id))
    .orderBy(desc(inquiries.createdAt));

  if (rows.length === 0) {
    console.log("No inquiries yet.");
    return;
  }

  console.log(`${rows.length} inquiries (newest first):\n`);
  for (const { i, companyName } of rows) {
    const when = i.createdAt.toISOString().slice(0, 16).replace("T", " ");
    console.log(
      `[${i.status.toUpperCase()}] ${when}  ${i.contactName} <${i.email}>${i.phone ? ` · ${i.phone}` : ""}`,
    );
    console.log(
      `   company: ${companyName ?? "—"}  |  interested: ${i.interestedIn ?? "—"}`,
    );
    if (i.message) console.log(`   message: ${i.message}`);
    console.log(`   id: ${i.id}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
