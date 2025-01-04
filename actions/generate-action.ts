"use server"

import { fetchFromGemini } from "@/lib/gemini"
import { fetchFromChatGPT } from "@/lib/puppeteer-chatgpt"
import { fetchFromClaude } from "@/lib/puppeteer-claude"

interface GenerateParams {
  referencePost: string
  info: string
  selectedModels: string[]
  selectedPlatform: "threads" | "telegram" | "threadofthreads"

  // New: we already built the final prompt in generateWithRequestAction
  prebuiltPrompt: string
}

export async function generateAction({
  referencePost,
  info,
  selectedModels,
  selectedPlatform,
  prebuiltPrompt
}: GenerateParams) {
  console.log("[generateAction] Received data:", {
    referencePost,
    info,
    selectedModels,
    selectedPlatform,
    prebuiltPromptLen: prebuiltPrompt?.length
  })

  // Instead of building a new prompt, reuse prebuiltPrompt
  const finalPrompt = prebuiltPrompt

  let chatGPTOutput = ""
  let claudeOutput = ""
  let geminiOutput = ""

  // ChatGPT (via Puppeteer)
  if (selectedModels.includes("chatgpt")) {
    console.log("[generateAction] User selected ChatGPT, calling fetchFromChatGPT...")
    chatGPTOutput = await fetchFromChatGPT(finalPrompt)
  }

  // Claude (via Puppeteer)
  if (selectedModels.includes("claude")) {
    console.log("[generateAction] User selected Claude, calling fetchFromClaude...")
    claudeOutput = await fetchFromClaude(finalPrompt)
  }

  // Gemini (via API)
  if (selectedModels.includes("gemini")) {
    console.log("[generateAction] User selected Gemini, calling Gemini API...")
    try {
      geminiOutput = await fetchFromGemini(finalPrompt)
    } catch (error) {
      console.error("[generateAction] Error with Gemini API:", error)
      geminiOutput = "Error: Failed to get response from Gemini"
    }
  }

  return {
    finalPrompt,
    chatGPTOutput,
    claudeOutput,
    geminiOutput
  }
}