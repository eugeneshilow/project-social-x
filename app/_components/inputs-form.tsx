"use client"

import { useState, useEffect } from "react"

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

  // We’ll log once on mount to confirm code is updated
  useEffect(() => {
    console.log("[InputsForm] Component mounted. Make sure you see this in the browser devtools.")
  }, [])

  // Log each time `selected` changes
  useEffect(() => {
    console.log("[InputsForm] selected changed:", selected)
  }, [selected])

  function handleCheckboxChange(model: string) {
    console.log("[InputsForm] handleCheckboxChange called for:", model)
    setSelected((prev) => {
      const alreadySelected = prev.includes(model)
      let newList
      if (alreadySelected) {
        newList = prev.filter((m) => m !== model)
      } else {
        newList = [...prev, model]
      }
      console.log("[InputsForm] Toggling model:", model, " old:", prev, " new:", newList)
      return newList
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log("[InputsForm] handleSubmit triggered, final 'selected':", selected)
    console.log("[InputsForm] localReferencePost:", localReferencePost)
    console.log("[InputsForm] localInfo:", localInfo)
    onGenerate({
      referencePost: localReferencePost,
      info: localInfo,
      selectedModels: selected
    })
  }

  // Extra button to check `selected` in the browser console at any time
  function handleTestClick() {
    console.log("[InputsForm] TEST BUTTON clicked. selected models =>", selected)
  }

  return (
    <div>
      <p className="mb-2 text-sm italic">
        (Open your browser devtools console to see the debug logs from <b>InputsForm</b>.)
      </p>
      <button
        type="button"
        className="mb-4 bg-yellow-300 px-3 py-1 rounded"
        onClick={handleTestClick}
      >
        Test Log `selected` State
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div>
          <label className="block mb-1 font-semibold">Reference Post</label>
          <textarea
            value={localReferencePost}
            onChange={(e) => {
              setLocalReferencePost(e.target.value)
              console.log("[InputsForm] localReferencePost changed:", e.target.value)
            }}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Enter the reference post here..."
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Additional Info</label>
          <textarea
            value={localInfo}
            onChange={(e) => {
              setLocalInfo(e.target.value)
              console.log("[InputsForm] localInfo changed:", e.target.value)
            }}
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