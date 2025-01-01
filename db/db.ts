import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

/**
 * db.ts
 * Drizzle/PG database instance using Supabase connection string
 * Make sure that process.env.SUPABASE_URL is set in your .env.local
 */

const pool = new Pool({
  connectionString: process.env.SUPABASE_URL
});

export const db = drizzle(pool, { schema });