import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const requestsTable = pgTable("requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  referencePost: text("reference_post").notNull(),
  info: text("info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateNow()
});

export type InsertRequest = typeof requestsTable.$inferInsert;
export type SelectRequest = typeof requestsTable.$inferSelect;