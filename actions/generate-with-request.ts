"use server"

import { revalidatePath } from "next/cache"
import { createRequest, getRequestById } from "@/db/queries/requests-queries"
import { createMultipleResultsAction } from "@/actions/db/results-actions"
import { InsertRequest } from "@/db/schema/requests-schema"
import { generateAction } from "@/actions/generate-action"
import { buildPrompt } from "@/lib/prompt-builder"

interface GenerateWithRequestParams {
  requestData: InsertRequest
  generateInput: {
    referencePost: string
    info: string
    selectedModels: string[]
    selectedPlatform: "threads" | "telegram" | "threadofthreads"
  }
  finalPosts: { finalPostText: string; postedLink: string }[]
}

/**
 * generateWithRequestAction
 * 1) Build final prompt
 * 2) create request row with that final prompt
 * 3) call generateAction
 * 4) insert final posts
 */
export async function generateWithRequestAction({
  requestData,
  generateInput,
  finalPosts
}: GenerateWithRequestParams) {
  console.log("[generateWithRequestAction] Starting =>", {
    requestData,
    generateInput,
    finalPosts
  })

  // 1) Build final prompt here
  // Choose the system prompt for clarity (threads, telegram, or threadofthreads)
  let systemPrompt = ""
  if (generateInput.selectedPlatform === "threads") {
    // Import threadsPrompt inline or from your existing logic
    const { threadsPrompt } = await import("@/prompts/threads-prompt")
    systemPrompt = threadsPrompt
  } else if (generateInput.selectedPlatform === "telegram") {
    const { telegramPrompt } = await import("@/prompts/telegram-prompt")
    systemPrompt = telegramPrompt
  } else {
    const { threadofthreadsPrompt } = await import("@/prompts/threadofthreads-prompt")
    systemPrompt = threadofthreadsPrompt
  }

  const finalPrompt = buildPrompt(systemPrompt, generateInput.referencePost, generateInput.info)

  // 2) create request row with final prompt
  let newRequest
  try {
    const insertResult = await createRequest({
      ...requestData,
      prompt: finalPrompt
    })
    newRequest = insertResult[0]
    console.log("[generateWithRequestAction] Inserted newRequest =>", newRequest)
  } catch (error) {
    console.error("[generateWithRequestAction] Error inserting request =>", error)
    return {
      isSuccess: false,
      message: "Failed to create request",
      data: null
    }
  }

  // Re-check DB existence
  const recheck = await getRequestById(newRequest.id)
  if (!recheck) {
    console.error("[generateWithRequestAction] Request row NOT found after insertion!")
    return {
      isSuccess: false,
      message: "Request row not found after insertion",
      data: null
    }
  }

  // 3) generate content (pass finalPrompt so we skip building it again)
  let generationResults
  try {
    console.log("[generateWithRequestAction] => calling generateAction with prebuiltPrompt")
    generationResults = await generateAction({
      ...generateInput,
      prebuiltPrompt: finalPrompt
    })
  } catch (error) {
    console.error("[generateWithRequestAction] generateAction error =>", error)
    return {
      isSuccess: false,
      message: "Failed generating content",
      data: null
    }
  }

  // 4) Insert final posts referencing the request row
  try {
    const resultsResp = await createMultipleResultsAction({
      requestId: newRequest.id,
      posts: finalPosts
    })
    if (!resultsResp.isSuccess) {
      return {
        isSuccess: false,
        message: "Failed to insert results",
        data: null
      }
    }
  } catch (error) {
    console.error("[generateWithRequestAction] Error inserting results =>", error)
    return {
      isSuccess: false,
      message: "Exception while inserting results",
      data: null
    }
  }

  revalidatePath("/")

  return {
    isSuccess: true,
    message: "All steps done successfully",
    data: {
      request: newRequest,
      generation: generationResults
    }
  }
}