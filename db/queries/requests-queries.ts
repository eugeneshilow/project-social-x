"use server";

import { db } from "@/db/db";
import { requestsTable, InsertRequest, SelectRequest } from "@/db/schema/requests-schema";
import { eq } from "drizzle-orm";

/**
 * Create a request row (now includes potential final posts/outputs).
 */
export async function createRequest(data: InsertRequest) {
  console.log("[createRequest] Inserting =>", data);

  try {
    const sql = db.insert(requestsTable).values(data).returning();
    console.log("[createRequest] SQL =>", sql.toSQL().sql, sql.toSQL().params);

    const [newRequest] = await sql;
    console.log("[createRequest] Insert result =>", newRequest);

    // Re-check the DB to confirm row is present
    const check = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.id, newRequest.id))
      .limit(1);

    if (!check?.[0]) {
      console.error("[createRequest] WARNING => Inserted row not found in DB!");
    }

    return [newRequest];
  } catch (error) {
    console.error("[createRequest] Error =>", error);
    throw error;
  }
}

/**
 * Get a request by ID
 */
export async function getRequestById(id: string): Promise<SelectRequest | null> {
  console.log("[getRequestById] =>", id);
  const [result] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, id));
  return result || null;
}

/**
 * Get all requests
 */
export async function getAllRequests() {
  console.log("[getAllRequests]");
  return db.select().from(requestsTable);
}