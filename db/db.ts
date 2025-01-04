import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { requestsTable } from "@/db/schema"

config({ path: ".env.local" })

const schema = {
  requests: requestsTable
}

// For migrations and seeding (more connections)
export const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 })

// For query purposes (fewer connections)
const queryClient = postgres(process.env.DATABASE_URL!)

export const db = drizzle(queryClient, { schema })