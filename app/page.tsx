"use client"

import { useState } from "react"
import InputsForm from "@/components/inputs-form"
import OutputsSection from "@/components/outputs-section"
import ResultsSection from "@/components/results-section"
import { generateWithRequestAction } from "@/actions/generate-with-request"

type LanguageType = "russian" | "english"
type PlatformType = 
  | "threads" 
  | "telegram" 
  | "threadofthreads" 
  | "zen-article" 
  | "zen-post"
  | "linkedin"
  | "reels"

export default function HomePage() {
  const [referencePost, setReferencePost] = useState("")
  const [info, setInfo] = useState("")
  const [summarizeInfo, setSummarizeInfo] = useState("")
  const [shortvidReference, setShortvidReference] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>("russian")
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("threads")

  const [chatGPTOutput, setChatGPTOutput] = useState("")
  const [claudeOutput, setClaudeOutput] = useState("")
  const [geminiOutput, setGeminiOutput] = useState("")
  const [claudeApiOutput, setClaudeApiOutput] = useState("")
  const [serverRequestId, setServerRequestId] = useState("")

  async function handleGenerate(formData: {
    referencePost: string
    info: string
    summarizeInfo: string
    shortvidReference: string
    selectedModels: string[]
  }) {
    const requestData = {
      userId: "demo-user",
      referencePost: formData.referencePost,
      additionalInfo: formData.info,
      selectedModels: formData.selectedModels.join(","),
      options: null,
      platform: selectedPlatform,
      prompt: ""
    }

    const generateInput = {
      referencePost: formData.referencePost,
      info: formData.info,
      summarizeInfo: formData.summarizeInfo,
      shortvidReference: formData.shortvidReference,
      selectedModels: formData.selectedModels,
      selectedPlatform,
      selectedLanguage
    }

    const resp = await generateWithRequestAction({
      requestData,
      generateInput,
      finalPosts: []
    })

    if (!resp.isSuccess) {
      console.error("[handleGenerate] Flow failed =>", resp.message)
      return
    }

    setServerRequestId(resp.data?.request.id || "")
    setChatGPTOutput(resp.data?.generation.chatGPTOutput || "")
    setClaudeOutput(resp.data?.generation.claudeOutput || "")
    setGeminiOutput(resp.data?.generation.geminiOutput || "")
    setClaudeApiOutput(resp.data?.generation.claudeApiOutput || "")
  }

  function handleOnGenerate(formData: {
    referencePost: string
    info: string
    summarizeInfo: string
    shortvidReference: string
    selectedModels: string[]
  }) {
    setReferencePost(formData.referencePost)
    setInfo(formData.info)
    setSummarizeInfo(formData.summarizeInfo)
    setShortvidReference(formData.shortvidReference)
    setSelectedModels(formData.selectedModels)
    setChatGPTOutput("")
    setClaudeOutput("")
    setGeminiOutput("")
    setClaudeApiOutput("")
    setServerRequestId("")

    void handleGenerate(formData)
  }

  return (
    <div className="min-h-screen p-4 flex flex-col gap-8">
      <div className="max-w-2xl mx-auto w-full p-4 border rounded-md shadow-sm">
        <h1 className="text-xl font-bold mb-4">Automated Post Generation</h1>

        {/* Language selection */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Select Language:</label>
          <select
            className="border rounded p-2 w-full"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as LanguageType)}
          >
            <option value="russian">Russian</option>
            <option value="english">English</option>
          </select>
        </div>

        {/* Platform selection */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Select Platform Prompt:</label>
          <select
            className="border rounded p-2 w-full"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as PlatformType)}
          >
            <option value="threads">Threads Prompt</option>
            <option value="telegram">Telegram Prompt</option>
            <option value="threadofthreads">Thread of Threads Prompt</option>
            <option value="zen-article">Zen Article Prompt</option>
            <option value="zen-post">Zen Post Prompt</option>
            <option value="linkedin">LinkedIn Prompt</option>
            <option value="reels">Reels Prompt</option>
          </select>
        </div>

        <InputsForm onGenerate={handleOnGenerate} />
      </div>

      <OutputsSection
        chatGPTOutput={chatGPTOutput}
        claudeOutput={claudeOutput}
        geminiOutput={geminiOutput}
        claudeApiOutput={claudeApiOutput}
      />

      <ResultsSection
        selectedPlatform={selectedPlatform}
        requestId={serverRequestId}
      />
    </div>
  )
}