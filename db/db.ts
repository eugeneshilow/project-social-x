import { requestsTable, responsesTable, resultsTable } from "@/db/schema";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config({ path: ".env.local" });

const schema = {
  requests: requestsTable,
  responses: responsesTable,
  results: resultsTable
};

// For migrations and seeding (more connections)
export const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });

// For query purposes (fewer connections)
const queryClient = postgres(process.env.DATABASE_URL!);

export const db = drizzle(queryClient, { schema });