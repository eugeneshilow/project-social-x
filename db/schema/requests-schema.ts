import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const requestsTable = pgTable("requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  referencePost: text("reference_post").notNull(),
  additionalInfo: text("additional_info"),
  selectedModels: text("selected_models").notNull(),
  options: text("options"),

  // Store final posts (array/object) from multiple platforms
  finalPosts: jsonb("final_posts"),

  // Removed: outputs column

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertRequest = typeof requestsTable.$inferInsert;
export type SelectRequest = typeof requestsTable.$inferSelect;