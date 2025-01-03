"use server"

import { revalidatePath } from "next/cache"
import { createResult } from "@/db/queries/results-queries"
import { InsertResult } from "@/db/schema/results-schema"

interface PostItem {
  finalPostText: string
  postedLink: string
}

interface CreateMultipleResultsParams {
  requestId: string
  posts: PostItem[]
}

/**
 * createMultipleResultsAction
 * Saves an array of final posts in the `results` table, referencing a specific requestId.
 */
export async function createMultipleResultsAction({
  requestId,
  posts
}: CreateMultipleResultsParams) {
  try {
    for (const p of posts) {
      const data: InsertResult = {
        requestId,
        finalPostText: p.finalPostText,
        postedLink: p.postedLink
      }
      await createResult(data)
    }

    // Optionally revalidate any path(s) that depend on these results
    revalidatePath("/")

    return { isSuccess: true, message: "Results saved successfully" }
  } catch (error) {
    console.error("[createMultipleResultsAction] Error =>", error)
    return { isSuccess: false, message: "Failed to save results" }
  }
}