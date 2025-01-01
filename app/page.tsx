"use client"

import { useState } from "react"
import InputsForm from "./_components/inputs-form"
import OutputsSection from "./_components/outputs-section"

export default function HomePage() {
  const [referencePost, setReferencePost] = useState("")
  const [info, setInfo] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [chatGPTOutput, setChatGPTOutput] = useState("")
  const [claudeOutput, setClaudeOutput] = useState("")
  const [geminiOutput, setGeminiOutput] = useState("")

  // Placeholder for generating outputs
  // In a future step, call a server action or API here
  async function handleGenerate() {
    // For now, just set mock outputs
    if (selectedModels.includes("chatgpt")) {
      setChatGPTOutput(`Mock ChatGPT response for: "${referencePost}" + "${info}"`)
    }
    if (selectedModels.includes("claude")) {
      setClaudeOutput(`Mock Claude response for: "${referencePost}" + "${info}"`)
    }
    if (selectedModels.includes("gemini")) {
      setGeminiOutput(`Mock Gemini response for: "${referencePost}" + "${info}"`)
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

    // Reset outputs before generating
    setChatGPTOutput("")
    setClaudeOutput("")
    setGeminiOutput("")

    handleGenerate()
  }

  return (
    <div className="min-h-screen p-4 flex flex-col gap-8">
      <div className="max-w-2xl mx-auto w-full p-4 border rounded-md shadow-sm">
        <h1 className="text-xl font-bold mb-4">Automated Post Generation</h1>

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