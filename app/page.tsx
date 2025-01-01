"use client"

import { useState } from "react"
import InputsForm from "./_components/inputs-form"
import OutputsSection from "./_components/outputs-section"
import { generateAction } from "./_actions/generate-action"

export default function HomePage() {
  const [referencePost, setReferencePost] = useState("")
  const [info, setInfo] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [chatGPTOutput, setChatGPTOutput] = useState("")
  const [claudeOutput, setClaudeOutput] = useState("")
  const [geminiOutput, setGeminiOutput] = useState("")

  // Keep the existing dropdown for prompt template
  const [selectedPlatform, setSelectedPlatform] = useState<"threads" | "telegram">("threads")

  // Called after user fills the form and clicks "Generate"
  async function handleGenerate() {
    console.log("[handleGenerate] Invoked with data:", {
      referencePost,
      info,
      selectedModels,
      selectedPlatform
    })

    try {
      // Call server action with the user’s inputs
      const result = await generateAction({
        referencePost,
        info,
        selectedModels,
        selectedPlatform
      })

      console.log("[handleGenerate] Server action result:", result)

      // Update local states with the returned outputs
      setChatGPTOutput(result.chatGPTOutput)
      setClaudeOutput(result.claudeOutput)
      setGeminiOutput(result.geminiOutput)
    } catch (err) {
      console.error("[handleGenerate] Error calling generateAction:", err)
    }
  }

  function handleOnGenerate(formData: {
    referencePost: string
    info: string
    selectedModels: string[]
  }) {
    console.log("[handleOnGenerate] Received form data:", formData)
    setReferencePost(formData.referencePost)
    setInfo(formData.info)
    setSelectedModels(formData.selectedModels)

    // Reset old outputs
    setChatGPTOutput("")
    setClaudeOutput("")
    setGeminiOutput("")

    // Trigger the Puppeteer + LLM logic
    void handleGenerate()
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