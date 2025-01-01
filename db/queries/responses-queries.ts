"use server";

import { db } from "@/db/db";
import { InsertResponse, responsesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * responses-queries.ts
 * Example queries for 'responses' table
 */

// Create
export async function createResponse(data: InsertResponse) {
  const [newResponse] = await db.insert(responsesTable).values(data).returning();
  return newResponse;
}

// Get all
export async function getAllResponses() {
  return db.select().from(responsesTable);
}

// Get by requestId
export async function getResponsesByRequestId(requestId: string) {
  return db
    .select()
    .from(responsesTable)
    .where(eq(responsesTable.requestId, requestId));
}