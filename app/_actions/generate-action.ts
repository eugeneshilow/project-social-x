"use server"

import { buildPrompt } from "@/lib/prompt-builder"
import { telegramPrompt } from "@/prompts/telegram-prompt"
import { threadsPrompt } from "@/prompts/threads-prompt"
import { fetchFromClaude } from "@/lib/puppeteer-client"

interface GenerateParams {
  referencePost: string
  info: string
  selectedModels: string[]
  selectedPlatform: "threads" | "telegram"
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
  const systemPrompt = selectedPlatform === "threads" ? threadsPrompt : telegramPrompt

  // 2. Build final prompt
  const finalPrompt = buildPrompt(systemPrompt, referencePost, info)
  console.log("[generateAction] Final prompt built:", finalPrompt)

  let chatGPTOutput = ""
  let claudeOutput = ""
  let geminiOutput = ""

  // ChatGPT (placeholder)
  if (selectedModels.includes("chatgpt")) {
    chatGPTOutput = `[ChatGPT] Final Prompt:\n${finalPrompt}`
  }

  // Claude (via Puppeteer)
  if (selectedModels.includes("claude")) {
    console.log("[generateAction] Calling Puppeteer fetchFromClaude...")
    claudeOutput = await fetchFromClaude(finalPrompt)
    console.log("[generateAction] Puppeteer returned for Claude:", claudeOutput)
  }

  // Gemini (placeholder)
  if (selectedModels.includes("gemini")) {
    geminiOutput = `[Gemini] Final Prompt:\n${finalPrompt}`
  }

  return {
    chatGPTOutput,
    claudeOutput,
    geminiOutput
  }
}