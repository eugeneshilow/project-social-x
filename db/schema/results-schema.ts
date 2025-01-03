import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { requestsTable } from "./requests-schema"

export const resultsTable = pgTable("results", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .references(() => requestsTable.id, { onDelete: "cascade" })
    .notNull(),
  finalPostText: text("final_post_text").notNull(),
  postedLink: text("posted_link").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertResult = typeof resultsTable.$inferInsert
export type SelectResult = typeof resultsTable.$inferSelect