import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { requestsTable } from "./requests-schema";

/**
 * You can store possible model names in an enum for clarity
 */
export const llmEnum = pgEnum("llm_model", ["chatgpt", "claude", "gemini"]);

export const responsesTable = pgTable("responses", {
  id: uuid("id").defaultRandom().primaryKey(),

  // references requests.id with cascade delete
  requestId: uuid("request_id")
    .references(() => requestsTable.id, { onDelete: "cascade" })
    .notNull(),

  model: llmEnum("model").notNull(),
  output: text("output"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateNow()
});

export type InsertResponse = typeof responsesTable.$inferInsert;
export type SelectResponse = typeof responsesTable.$inferSelect;