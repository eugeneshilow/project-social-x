"use client"

interface OutputsSectionProps {
  chatGPTOutput: string
  claudeOutput: string
  geminiOutput: string
}

export default function OutputsSection({
  chatGPTOutput,
  claudeOutput,
  geminiOutput
}: OutputsSectionProps) {
  return (
    <div className="max-w-2xl mx-auto w-full p-4 border rounded-md shadow-sm">
      <h2 className="text-lg font-bold mb-4">Outputs</h2>

      <div className="mb-4">
        <h3 className="font-semibold">ChatGPT Output</h3>
        <div className="p-2 mt-1 border border-gray-300 rounded">
          {chatGPTOutput || "No output"}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Claude Output</h3>
        <div className="p-2 mt-1 border border-gray-300 rounded">
          {claudeOutput || "No output"}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Gemini Output</h3>
        <div className="p-2 mt-1 border border-gray-300 rounded">
          {geminiOutput || "No output"}
        </div>
      </div>
    </div>
  )
}