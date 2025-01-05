/**
 * prompt-builder.ts
 *
 * This file provides a helper function to merge user-supplied
 * "reference post" and "info" with system-level prompts.
 *
 * For example, after retrieving the system prompt for Threads,
 * you can replace <post-reference> and <info> placeholders
 * with user-supplied data. We also handle <information-to-summarize>.
 */

export function buildPrompt(
  systemPrompt: string,
  referencePost: string,
  info: string,
  summarizeInfo: string = ""
) {
  let finalPrompt = systemPrompt || ""

  if (finalPrompt) {
    // Replace <post-reference>
    finalPrompt = finalPrompt.replace(
      /<post-reference>\n([\s\S]*?)<\/post-reference>/,
      `<post-reference>\n${referencePost}\n</post-reference>`
    )

    // Replace <info>
    finalPrompt = finalPrompt.replace(
      /<info>\n([\s\S]*?)<\/info>/,
      `<info>\n${info}\n</info>`
    )

    // Replace <information-to-summarize>
    finalPrompt = finalPrompt.replace(
      /<information-to-summarize>\n([\s\S]*?)<\/information-to-summarize>/,
      `<information-to-summarize>\n${summarizeInfo}\n</information-to-summarize>`
    )
  }

  return finalPrompt
}