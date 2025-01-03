import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { requestsTable } from "./requests-schema";

export const responsesTable = pgTable("responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .references(() => requestsTable.id, { onDelete: "cascade" })
    .notNull(),
  model: text("model").notNull(),
  output: text("output").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertResponse = typeof responsesTable.$inferInsert;
export type SelectResponse = typeof responsesTable.$inferSelect;