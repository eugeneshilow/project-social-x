"use client"

import { useState, useTransition } from "react"
import { createMultipleResultsAction } from "@/actions/db/results-actions"

interface ResultsSectionProps {
  selectedPlatform: "threads" | "telegram"
  requestId: string
}

export default function ResultsSection({ selectedPlatform, requestId }: ResultsSectionProps) {
  const [results, setResults] = useState<
    { id: number; finalPostText: string; postLink: string }[]
  >([])

  const [isPending, startTransition] = useTransition()
  const [saveMessage, setSaveMessage] = useState("")

  function handleAddPost() {
    const newId = results.length > 0 ? results[results.length - 1].id + 1 : 1
    setResults([...results, { id: newId, finalPostText: "", postLink: "" }])
  }

  function handleRemovePost(id: number) {
    setResults(results.filter((r) => r.id !== id))
  }

  function handleChange(
    id: number,
    field: "finalPostText" | "postLink",
    value: string
  ) {
    setResults((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const linkPlaceholder =
    selectedPlatform === "threads"
      ? "https://threads.net/..."
      : "https://t.me/..."

  function handleSaveResults() {
    const posts = results.map((r) => ({
      finalPostText: r.finalPostText,
      postedLink: r.postLink
    }))

    startTransition(async () => {
      setSaveMessage("Saving...")
      const response = await createMultipleResultsAction({ requestId, posts })
      if (response.isSuccess) {
        setSaveMessage("Results saved successfully!")
      } else {
        setSaveMessage("Failed to save results.")
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto w-full p-4 border rounded-md shadow-sm mt-4">
      <h2 className="text-lg font-bold mb-4">Results</h2>

      <button
        type="button"
        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleAddPost}
      >
        + Add Post
      </button>

      {results.length === 0 && (
        <p className="text-sm italic text-gray-500 mb-4">
          No posts added yet. Click "Add Post" to create a new post.
        </p>
      )}

      {results.map((postItem) => (
        <div key={postItem.id} className="border rounded p-3 mb-4">
          <label className="block mb-1 font-semibold">
            Final Post Text (Post #{postItem.id})
          </label>
          <textarea
            className="w-full border border-gray-300 rounded p-2"
            rows={4}
            placeholder="Paste or type the final post text..."
            value={postItem.finalPostText}
            onChange={(e) =>
              handleChange(postItem.id, "finalPostText", e.target.value)
            }
          />

          <label className="block mt-2 mb-1 font-semibold">
            Link to Posted Item
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded p-2"
            placeholder={linkPlaceholder}
            value={postItem.postLink}
            onChange={(e) =>
              handleChange(postItem.id, "postLink", e.target.value)
            }
          />

          <button
            type="button"
            className="mt-2 text-red-600 hover:underline"
            onClick={() => handleRemovePost(postItem.id)}
          >
            Remove
          </button>
        </div>
      ))}

      {results.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-500 transition-colors"
            onClick={handleSaveResults}
            disabled={isPending}
          >
            Save All Results
          </button>
          {saveMessage && (
            <p
              className={`text-sm ${
                saveMessage.includes("success")
                  ? "text-green-600"
                  : saveMessage.includes("Failed")
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {saveMessage}
            </p>
          )}
        </div>
      )}
    </div>
  )
}