import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Migrations run against the direct connection (port 5432), not the pooler.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
