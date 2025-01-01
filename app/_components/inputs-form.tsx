"use client"

import { useState } from "react"

interface InputsFormProps {
  onGenerate: (formData: {
    referencePost: string
    info: string
    selectedModels: string[]
  }) => void
}

export default function InputsForm({ onGenerate }: InputsFormProps) {
  const [localReferencePost, setLocalReferencePost] = useState("")
  const [localInfo, setLocalInfo] = useState("")
  const [selected, setSelected] = useState<string[]>([])

  function handleCheckboxChange(model: string) {
    setSelected((prev) =>
      prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onGenerate({
      referencePost: localReferencePost,
      info: localInfo,
      selectedModels: selected
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div>
          <label className="block mb-1 font-semibold">
            Reference Post
          </label>
          <textarea
            value={localReferencePost}
            onChange={(e) => setLocalReferencePost(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Enter the reference post here..."
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Additional Info
          </label>
          <textarea
            value={localInfo}
            onChange={(e) => setLocalInfo(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Enter any additional info or instructions..."
            rows={3}
          />
        </div>

        <div>
          <p className="font-semibold mb-2">Select Model(s):</p>
          
          <div className="flex items-center gap-4">
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
              <span>Claude</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={() => handleCheckboxChange("gemini")}
                checked={selected.includes("gemini")}
              />
              <span>Gemini</span>
            </label>
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-500 transition-colors"
          >
            Generate
          </button>
        </div>
      </form>
    </div>
  )
}