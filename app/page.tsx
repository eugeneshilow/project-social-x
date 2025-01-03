"use client"

import { useState } from "react"

// Updated to new location
import InputsForm from "@/components/inputs-form"
import OutputsSection from "@/components/outputs-section"
import ResultsSection from "@/components/results-section"

import { generateWithRequestAction } from "@/actions/generate-with-request"

export default function HomePage() {
  const [referencePost, setReferencePost] = useState("")
  const [info, setInfo] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [chatGPTOutput, setChatGPTOutput] = useState("")
  const [claudeOutput, setClaudeOutput] = useState("")
  const [geminiOutput, setGeminiOutput] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState<"threads" | "telegram">("threads")

  const [serverRequestId, setServerRequestId] = useState("")

  async function handleGenerate(formData: {
    referencePost: string
    info: string
    selectedModels: string[]
  }) {
    console.log("[handleGenerate] formData =>", formData)
    const generateInput = {
      referencePost: formData.referencePost,
      info: formData.info,
      selectedModels: formData.selectedModels,
      selectedPlatform
    }

    const requestData = {
      userId: "demo-user",
      referencePost: formData.referencePost,
      additionalInfo: formData.info,
      selectedModels: formData.selectedModels.join(","),
      options: null
    }

    const resp = await generateWithRequestAction({
      requestData,
      generateInput,
      finalPosts: []
    })

    console.log("[handleGenerate] => generateWithRequestAction =>", resp)

    if (!resp.isSuccess) {
      console.error("[handleGenerate] Flow failed =>", resp.message)
      return
    }

    setServerRequestId(resp.data?.request.id || "")
    setChatGPTOutput(resp.data?.generation.chatGPTOutput || "")
    setClaudeOutput(resp.data?.generation.claudeOutput || "")
    setGeminiOutput(resp.data?.generation.geminiOutput || "")
  }

  function handleOnGenerate(formData: {
    referencePost: string
    info: string
    selectedModels: string[]
  }) {
    setReferencePost(formData.referencePost)
    setInfo(formData.info)
    setSelectedModels(formData.selectedModels)
    setChatGPTOutput("")
    setClaudeOutput("")
    setGeminiOutput("")
    setServerRequestId("")

    void handleGenerate(formData)
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

      <ResultsSection
        selectedPlatform={selectedPlatform}
        requestId={serverRequestId}
      />
    </div>
  )
}