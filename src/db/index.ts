import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Supabase pooled connection (port 6543, pgbouncer). Disable prepared
// statements for transaction-pooling compatibility.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };
