"use server";

import Anthropic from "@anthropic-ai/sdk";

/**
 * fetchFromClaudeApi
 * Calls the official Claude API using an API key stored in process.env.CLAUDE_API_KEY
 */
export async function fetchFromClaudeApi(prompt: string): Promise<string> {
  console.log("[fetchFromClaudeApi] Starting official Claude API call...");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[fetchFromClaudeApi] No ANTHROPIC_API_KEY found in env!");
    return "Error: Anthropic API key not found.";
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    // Extract the text content from the response
    const completionText = message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("\n");

    // We will wrap it in the same JSON structure as other LLM responses
    const finalData = JSON.stringify({
      rawHTML: completionText,
      strippedText: completionText,
    });

    return finalData;
  } catch (error: any) {
    console.error("[fetchFromClaudeApi] Exception =>", error);
    return "Error: Failed to call Claude API.";
  }
}