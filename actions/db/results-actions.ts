"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db/db"
import { requestsTable } from "@/db/schema/requests-schema"

interface PostItem {
  finalPostText: string
  postLink: string
}

interface CreateMultipleResultsParams {
  requestId: string
  posts: PostItem[]
}

/**
 * createMultipleResultsAction
 * Adds final posts (text + link) to the 'finalPosts' array in the 'requests' table.
 */
export async function createMultipleResultsAction({
  requestId,
  posts
}: CreateMultipleResultsParams) {
  console.log("[createMultipleResultsAction] =>", { requestId, posts })

  try {
    // 1) Fetch the existing request
    const [existing] = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.id, requestId))

    if (!existing) {
      console.error("[createMultipleResultsAction] => request not found")
      return { isSuccess: false, message: "Request not found" }
    }

    // 2) Combine old finalPosts with new
    const oldPosts = existing.finalPosts ?? []
    const newPosts = [...oldPosts, ...posts]

    // 3) Update the row
    const [updated] = await db
      .update(requestsTable)
      .set({ finalPosts: newPosts })
      .where(eq(requestsTable.id, requestId))
      .returning()

    // 4) Revalidate
    revalidatePath("/")

    console.log("[createMultipleResultsAction] => updated:", updated)
    return {
      isSuccess: true,
      message: "Results saved successfully",
      data: updated
    }
  } catch (error) {
    console.error("[createMultipleResultsAction] => Error:", error)
    return { isSuccess: false, message: "Failed to save results" }
  }
}