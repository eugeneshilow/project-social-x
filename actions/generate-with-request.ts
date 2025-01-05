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
    selectedPlatform: string
    selectedLanguage: string
  }
  finalPosts: { finalPostText: string; postedLink: string }[]
}

export async function generateWithRequestAction({
  requestData,
  generateInput,
  finalPosts
}: GenerateWithRequestParams) {
  console.log("[generateWithRequestAction] =>", {
    requestData,
    generateInput,
    finalPosts
  })

  const { selectedPlatform, selectedLanguage } = generateInput

  // 1) Dynamically import the relevant system prompt
  let systemPrompt = ""
  try {
    if (selectedLanguage === "russian") {
      if (selectedPlatform === "threads") {
        const { threadsPrompt } = await import("@/prompts/russian/ru-threads-prompt")
        systemPrompt = threadsPrompt
      } else if (selectedPlatform === "telegram") {
        const { telegramPrompt } = await import("@/prompts/russian/ru-telegram-prompt")
        systemPrompt = telegramPrompt
      } else if (selectedPlatform === "threadofthreads") {
        const { threadofthreadsPrompt } = await import("@/prompts/russian/ru-threadofthreads-prompt")
        systemPrompt = threadofthreadsPrompt
      } else if (selectedPlatform === "zen-article") {
        const { zenArticlePrompt } = await import("@/prompts/russian/ru-zen-article-prompt")
        systemPrompt = zenArticlePrompt
      } else if (selectedPlatform === "zen-post") {
        const { zenPostPrompt } = await import("@/prompts/russian/ru-zen-post-prompt")
        systemPrompt = zenPostPrompt
      } else if (selectedPlatform === "linkedin") {
        console.log("[generateWithRequestAction] Russian + LinkedIn => fallback to threads prompt")
        const { threadsPrompt } = await import("@/prompts/russian/ru-threads-prompt")
        systemPrompt = threadsPrompt
      } else {
        const { threadsPrompt } = await import("@/prompts/russian/ru-threads-prompt")
        systemPrompt = threadsPrompt
      }
    } else {
      // English
      if (selectedPlatform === "threads") {
        const { ENThreadsPrompt } = await import("@/prompts/english/en-threads-prompt")
        systemPrompt = ENThreadsPrompt
      } else if (selectedPlatform === "telegram") {
        const { ENTelegramPrompt } = await import("@/prompts/english/en-telegram-prompt")
        systemPrompt = ENTelegramPrompt
      } else if (selectedPlatform === "linkedin") {
        const { ENLinkedInPrompt } = await import("@/prompts/english/en-linkedin-prompt")
        systemPrompt = ENLinkedInPrompt
      } else if (selectedPlatform === "threadofthreads") {
        console.log("[generateWithRequestAction] English + ThreadOfThreads => fallback to EN Threads Prompt")
        const { ENThreadsPrompt } = await import("@/prompts/english/en-threads-prompt")
        systemPrompt = ENThreadsPrompt
      } else if (selectedPlatform === "zen-article") {
        console.log("[generateWithRequestAction] English + Zen-article => fallback to EN Threads Prompt")
        const { ENThreadsPrompt } = await import("@/prompts/english/en-threads-prompt")
        systemPrompt = ENThreadsPrompt
      } else if (selectedPlatform === "zen-post") {
        console.log("[generateWithRequestAction] English + Zen-post => fallback to EN Threads Prompt")
        const { ENThreadsPrompt } = await import("@/prompts/english/en-threads-prompt")
        systemPrompt = ENThreadsPrompt
      } else {
        const { ENThreadsPrompt } = await import("@/prompts/english/en-threads-prompt")
        systemPrompt = ENThreadsPrompt
      }
    }
  } catch (err) {
    console.error("[generateWithRequestAction] Error loading system prompt =>", err)
    return {
      isSuccess: false,
      message: "Failed to load system prompt dynamically",
      data: null
    }
  }

  // 2) Build final prompt
  const finalPrompt = buildPrompt(systemPrompt, generateInput.referencePost, generateInput.info)

  // 3) create request row with final prompt
  let newRequest
  try {
    const insertResult = await createRequest({
      ...requestData,
      language: selectedLanguage === "english" ? "eng" : "rus",
      prompt: finalPrompt
    })
    newRequest = insertResult[0]
  } catch (error) {
    console.error("[generateWithRequestAction] Error inserting request =>", error)
    return {
      isSuccess: false,
      message: "Failed to create request",
      data: null
    }
  }

  const recheck = await getRequestById(newRequest.id)
  if (!recheck) {
    console.error("[generateWithRequestAction] Request not found after insertion!")
    return {
      isSuccess: false,
      message: "Request row not found after insertion",
      data: null
    }
  }

  // 4) generate content
  let generationResults
  try {
    console.log("[generateWithRequestAction] => calling generateAction with prebuiltPrompt")
    generationResults = await generateAction({
      referencePost: generateInput.referencePost,
      info: generateInput.info,
      selectedModels: generateInput.selectedModels,
      selectedPlatform: generateInput.selectedPlatform as "threads"|"telegram"|"threadofthreads",
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

  // 5) Insert final posts referencing the request
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
      message: "Exception inserting results",
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