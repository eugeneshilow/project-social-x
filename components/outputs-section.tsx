"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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

  function parseLLMOutput(output: string) {
    try {
      const parsed = JSON.parse(output)
      const { rawHTML = "", strippedText = "" } = parsed
      return { rawHTML, strippedText }
    } catch {
      return { rawHTML: output, strippedText: output }
    }
  }

  const chatGPT = parseLLMOutput(chatGPTOutput)
  const claude = parseLLMOutput(claudeOutput)
  const gemini = parseLLMOutput(geminiOutput)

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-8 py-6 border rounded-md shadow-sm">
      <h2 className="text-lg font-bold mb-4">Outputs</h2>

      {/* ChatGPT */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">ChatGPT Output</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Raw</p>
            <p className="leading-relaxed whitespace-pre-wrap">
              {chatGPT.rawHTML || "No output"}
            </p>
          </div>
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Markdown</p>
            {chatGPT.strippedText ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-lg max-w-none leading-relaxed space-y-4"
              >
                {chatGPT.strippedText}
              </ReactMarkdown>
            ) : (
              <p>No output</p>
            )}
          </div>
        </div>
      </div>

      {/* Claude */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Claude Output</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Raw</p>
            <p className="leading-relaxed whitespace-pre-wrap">
              {claude.rawHTML || "No output"}
            </p>
          </div>
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Markdown</p>
            {claude.strippedText ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-lg max-w-none leading-relaxed space-y-4"
              >
                {claude.strippedText}
              </ReactMarkdown>
            ) : (
              <p>No output</p>
            )}
          </div>
        </div>
      </div>

      {/* Gemini */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Gemini Output</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Raw</p>
            <p className="leading-relaxed whitespace-pre-wrap">
              {gemini.rawHTML || "No output"}
            </p>
          </div>
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Markdown</p>
            {gemini.strippedText ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-lg max-w-none leading-relaxed space-y-4"
              >
                {gemini.strippedText}
              </ReactMarkdown>
            ) : (
              <p>No output</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}