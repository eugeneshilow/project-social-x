"use server"

import { db } from "@/db/db"
import { eq } from "drizzle-orm"
import { InsertResult, resultsTable } from "@/db/schema/results-schema"

/**
 * results-queries.ts
 * CRUD queries for the 'results' table
 */

// Create
export async function createResult(data: InsertResult) {
  const [newResult] = await db.insert(resultsTable).values(data).returning()
  return newResult
}

// Get all
export async function getAllResults() {
  return db.select().from(resultsTable).orderBy(resultsTable.createdAt)
}

// Get by id
export async function getResultById(id: string) {
  const [row] = await db
    .select()
    .from(resultsTable)
    .where(eq(resultsTable.id, id))
  return row
}

// Get all by requestId
export async function getResultsByRequestId(requestId: string) {
  return db
    .select()
    .from(resultsTable)
    .where(eq(resultsTable.requestId, requestId))
    .orderBy(resultsTable.createdAt)
}

// Update finalPostText or postedLink (an example)
export async function updateResult(
  id: string,
  data: Partial<Pick<InsertResult, "finalPostText" | "postedLink">>
) {
  const [updated] = await db
    .update(resultsTable)
    .set(data)
    .where(eq(resultsTable.id, id))
    .returning()
  return updated
}

// Delete a result
export async function deleteResult(id: string) {
  const [deleted] = await db.delete(resultsTable).where(eq(resultsTable.id, id)).returning()
  return deleted
}