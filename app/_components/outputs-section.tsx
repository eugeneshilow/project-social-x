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
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-8 py-6 border rounded-md shadow-sm">
      <h2 className="text-lg font-bold mb-4">Outputs</h2>

      {/* ChatGPT */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">ChatGPT Output</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Raw */}
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Raw</p>
            <p className="leading-relaxed whitespace-pre-wrap">
              {chatGPTOutput || "No output"}
            </p>
          </div>
          {/* Markdown */}
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Markdown</p>
            {chatGPTOutput ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-lg max-w-none leading-relaxed space-y-4"
              >
                {chatGPTOutput}
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
          {/* Raw */}
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Raw</p>
            <p className="leading-relaxed whitespace-pre-wrap">
              {claudeOutput || "No output"}
            </p>
          </div>
          {/* Markdown */}
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Markdown</p>
            {claudeOutput ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-lg max-w-none leading-relaxed space-y-4"
              >
                {claudeOutput}
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
          {/* Raw */}
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Raw</p>
            <p className="leading-relaxed whitespace-pre-wrap">
              {geminiOutput || "No output"}
            </p>
          </div>
          {/* Markdown */}
          <div className="p-2 border border-gray-300 rounded">
            <p className="text-sm font-bold mb-1">Markdown</p>
            {geminiOutput ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-lg max-w-none leading-relaxed space-y-4"
              >
                {geminiOutput}
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