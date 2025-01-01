"use server";

import { db } from "@/db/db";
import { requestsTable, InsertRequest } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * requests-queries.ts
 * Example queries for 'requests' table
 */

// Create
export async function createRequest(data: InsertRequest) {
  const [newRequest] = await db.insert(requestsTable).values(data).returning();
  return newRequest;
}

// Get all (for demonstration)
export async function getAllRequests() {
  return db.select().from(requestsTable);
}

// Get by id
export async function getRequestById(id: string) {
  const [request] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, id));
  return request;
}