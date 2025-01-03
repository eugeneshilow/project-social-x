"use server"

import { revalidatePath } from "next/cache"
import { createRequest, getRequestById } from "@/db/queries/requests-queries"
import { createMultipleResultsAction } from "@/actions/db/results-actions"
import { InsertRequest } from "@/db/schema/requests-schema"
import { generateAction } from "@/actions/generate-action"
import { createResponse } from "@/db/queries/responses-queries"

interface GenerateWithRequestParams {
  requestData: InsertRequest
  generateInput: {
    referencePost: string
    info: string
    selectedModels: string[]
    selectedPlatform: "threads" | "telegram"
  }
  finalPosts: { finalPostText: string; postedLink: string }[]
}

/**
 * generateWithRequestAction
 * 1) create request row
 * 2) call generateAction
 * 3) insert final posts
 * 4) insert model responses
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

  // 1) Insert row in 'requests'
  let newRequest
  try {
    const insertResult = await createRequest(requestData)
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
  console.log("[generateWithRequestAction] Re-check =>", recheck)
  if (!recheck) {
    console.error("[generateWithRequestAction] Request row NOT found after insertion!")
    return {
      isSuccess: false,
      message: "Request row not found after insertion",
      data: null
    }
  }

  // 2) generate content
  let generationResults
  try {
    console.log("[generateWithRequestAction] Calling generateAction =>", generateInput)
    generationResults = await generateAction(generateInput)
    console.log("[generateWithRequestAction] generateAction =>", generationResults)
  } catch (error) {
    console.error("[generateWithRequestAction] generateAction error =>", error)
    return {
      isSuccess: false,
      message: "Failed generating content",
      data: null
    }
  }

  // 3) Insert final posts referencing the request row
  try {
    console.log("[generateWithRequestAction] Inserting final posts =>", finalPosts)
    const resultsResp = await createMultipleResultsAction({
      requestId: newRequest.id,
      posts: finalPosts
    })
    console.log("[generateWithRequestAction] createMultipleResultsAction =>", resultsResp)
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

  // 4) Insert model responses (if any)
  try {
    const { selectedModels } = generateInput
    console.log("[generateWithRequestAction] Saving raw model outputs to 'responses' table...")

    // ChatGPT
    if (selectedModels.includes("chatgpt") && generationResults?.chatGPTOutput) {
      await createResponse({
        requestId: newRequest.id,
        model: "chatgpt",
        output: generationResults.chatGPTOutput
      })
    }

    // Claude
    if (selectedModels.includes("claude") && generationResults?.claudeOutput) {
      await createResponse({
        requestId: newRequest.id,
        model: "claude",
        output: generationResults.claudeOutput
      })
    }

    // Gemini
    if (selectedModels.includes("gemini") && generationResults?.geminiOutput) {
      await createResponse({
        requestId: newRequest.id,
        model: "gemini",
        output: generationResults.geminiOutput
      })
    }
  } catch (error) {
    console.error("[generateWithRequestAction] Error inserting responses =>", error)
    return {
      isSuccess: false,
      message: "Exception while inserting model responses",
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