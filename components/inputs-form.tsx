"use client"

import { useState, useEffect } from "react"

interface InputsFormProps {
  onGenerate: (formData: {
    referencePost: string
    info: string
    summarizeInfo: string
    shortvidReference: string
    selectedModels: string[]
  }) => void
}

export default function InputsForm({ onGenerate }: InputsFormProps) {
  const [localReferencePost, setLocalReferencePost] = useState("")
  const [localInfo, setLocalInfo] = useState("")
  const [summarizeInfo, setSummarizeInfo] = useState("")
  const [shortvidReference, setShortvidReference] = useState("")
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    console.log("[InputsForm] mounted.")
  }, [])

  function handleCheckboxChange(model: string) {
    setSelected((prev) => {
      const alreadySelected = prev.includes(model)
      return alreadySelected
        ? prev.filter((m) => m !== model)
        : [...prev, model]
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onGenerate({
      referencePost: localReferencePost,
      info: localInfo,
      summarizeInfo,
      shortvidReference,
      selectedModels: selected,
    })
  }

  return (
    <div>
      <p className="mb-2 text-sm italic">
        (Open devtools console to see debug logs from <b>InputsForm</b>.)
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 font-semibold">Reference Post</label>
          <textarea
            value={localReferencePost}
            onChange={(e) => setLocalReferencePost(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Enter the reference post here..."
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Additional Info</label>
          <textarea
            value={localInfo}
            onChange={(e) => setLocalInfo(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Enter additional info or instructions..."
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Summarize Info</label>
          <textarea
            value={summarizeInfo}
            onChange={(e) => setSummarizeInfo(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Enter content to be summarized..."
            rows={3}
          />
        </div>

        {/* Shortvid Reference field */}
        <div>
          <label className="block mb-1 font-semibold">Shortvid Reference</label>
          <textarea
            value={shortvidReference}
            onChange={(e) => setShortvidReference(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Optional: Enter the short video reference..."
            rows={3}
          />
        </div>

        <div>
          <p className="font-semibold mb-2">Select Model(s):</p>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={() => handleCheckboxChange("chatgpt")}
                checked={selected.includes("chatgpt")}
              />
              <span>ChatGPT</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={() => handleCheckboxChange("claude")}
                checked={selected.includes("claude")}
              />
              <span>Claude (Puppeteer)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={() => handleCheckboxChange("gemini")}
                checked={selected.includes("gemini")}
              />
              <span>Gemini</span>
            </label>

            {/* New Claude API */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={() => handleCheckboxChange("claudeAPI")}
                checked={selected.includes("claudeAPI")}
              />
              <span>Claude API</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-500 transition-colors"
        >
          Generate
        </button>
      </form>
    </div>
  )
}