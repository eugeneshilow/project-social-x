"use client"

import { useState } from "react"
import InputsForm from "./_components/inputs-form"
import OutputsSection from "./_components/outputs-section"

// We'll import the prompt-builder and the system prompts
import { buildPrompt } from "@/lib/prompt-builder"
import { telegramPrompt } from "@/prompts/telegram-prompt"
import { threadsPrompt } from "@/prompts/threads-prompt"

export default function HomePage() {
  const [referencePost, setReferencePost] = useState("")
  const [info, setInfo] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [chatGPTOutput, setChatGPTOutput] = useState("")
  const [claudeOutput, setClaudeOutput] = useState("")
  const [geminiOutput, setGeminiOutput] = useState("")

  // We'll also allow user to pick which "prompt template" they want (just for demonstration)
  const [selectedPlatform, setSelectedPlatform] = useState<"threads" | "telegram">("threads")

  // Placeholder for generating outputs
  async function handleGenerate() {
    // Step 1: Choose the appropriate system prompt
    const systemPrompt = selectedPlatform === "threads" ? threadsPrompt : telegramPrompt

    // Step 2: Build the final prompt with user input
    const finalPrompt = buildPrompt(systemPrompt, referencePost, info)

    // For demonstration, we simply show the final prompt in each output
    // In a real scenario, you'd send finalPrompt to your LLM or Puppeteer client.
    if (selectedModels.includes("chatgpt")) {
      setChatGPTOutput(`[ChatGPT] Final Prompt:\n${finalPrompt}`)
    }
    if (selectedModels.includes("claude")) {
      setClaudeOutput(`[Claude] Final Prompt:\n${finalPrompt}`)
    }
    if (selectedModels.includes("gemini")) {
      setGeminiOutput(`[Gemini] Final Prompt:\n${finalPrompt}`)
    }
  }

  function handleOnGenerate(formData: {
    referencePost: string
    info: string
    selectedModels: string[]
  }) {
    setReferencePost(formData.referencePost)
    setInfo(formData.info)
    setSelectedModels(formData.selectedModels)

    // Reset outputs
    setChatGPTOutput("")
    setClaudeOutput("")
    setGeminiOutput("")

    handleGenerate()
  }

  return (
    <div className="min-h-screen p-4 flex flex-col gap-8">
      <div className="max-w-2xl mx-auto w-full p-4 border rounded-md shadow-sm">

        <h1 className="text-xl font-bold mb-4">Automated Post Generation</h1>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Select Prompt Template:</label>
          <select
            className="border rounded p-2"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as "threads" | "telegram")}
          >
            <option value="threads">Threads Prompt</option>
            <option value="telegram">Telegram Prompt</option>
          </select>
        </div>

        <InputsForm onGenerate={handleOnGenerate} />
      </div>

      <OutputsSection
        chatGPTOutput={chatGPTOutput}
        claudeOutput={claudeOutput}
        geminiOutput={geminiOutput}
      />
    </div>
  )
}