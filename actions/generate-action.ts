"use server"

import { fetchFromGemini } from "@/lib/gemini"
import { buildPrompt } from "@/lib/prompt-builder"
import { fetchFromChatGPT } from "@/lib/puppeteer-chatgpt"
import { fetchFromClaude } from "@/lib/puppeteer-claude"
import { telegramPrompt } from "@/prompts/telegram-prompt"
import { threadsPrompt } from "@/prompts/threads-prompt"
import { threadofthreadsPrompt } from "@/prompts/threadofthreads-prompt"

interface GenerateParams {
  referencePost: string
  info: string
  selectedModels: string[]
  selectedPlatform: "threads" | "telegram" | "threadofthreads"
}

export async function generateAction({
  referencePost,
  info,
  selectedModels,
  selectedPlatform
}: GenerateParams) {
  console.log("[generateAction] Received data:", {
    referencePost,
    info,
    selectedModels,
    selectedPlatform
  })

  // 1. Choose system prompt
  let systemPrompt = threadsPrompt
  if (selectedPlatform === "telegram") {
    systemPrompt = telegramPrompt
  } else if (selectedPlatform === "threadofthreads") {
    systemPrompt = threadofthreadsPrompt
  }

  // 2. Build final prompt
  const finalPrompt = buildPrompt(systemPrompt, referencePost, info)
  console.log("[generateAction] Final prompt built:", finalPrompt)

  let chatGPTOutput = ""
  let claudeOutput = ""
  let geminiOutput = ""

  // ChatGPT (via Puppeteer)
  if (selectedModels.includes("chatgpt")) {
    console.log("[generateAction] User selected ChatGPT, calling fetchFromChatGPT...")
    chatGPTOutput = await fetchFromChatGPT(finalPrompt)
    console.log("[generateAction] Puppeteer returned for ChatGPT:", chatGPTOutput)
  }

  // Claude (via Puppeteer)
  if (selectedModels.includes("claude")) {
    console.log("[generateAction] User selected Claude, calling fetchFromClaude...")
    claudeOutput = await fetchFromClaude(finalPrompt)
    console.log("[generateAction] Puppeteer returned for Claude:", claudeOutput)
  }

  // Gemini (via API)
  if (selectedModels.includes("gemini")) {
    console.log("[generateAction] User selected Gemini, calling Gemini API...")
    try {
      geminiOutput = await fetchFromGemini(finalPrompt)
      console.log("[generateAction] Gemini API returned:", geminiOutput)
    } catch (error) {
      console.error("[generateAction] Error with Gemini API:", error)
      geminiOutput = "Error: Failed to get response from Gemini"
    }
  }

  return {
    chatGPTOutput,
    claudeOutput,
    geminiOutput
  }
}