/**
 * prompt-builder.ts
 * 
 * This file provides a helper function to merge user-supplied
 * "reference post" and "info" with system-level prompts.
 * 
 * For example, after retrieving the system prompt for Threads,
 * you can replace <post-reference> and <info> placeholders
 * with user-supplied data.
 */

export function buildPrompt(systemPrompt: string, referencePost: string, info: string) {
  // Insert the user inputs into the system-level prompt
  let finalPrompt = systemPrompt

  // Replace <info> ... </info> with user info (or empty if none)
  finalPrompt = finalPrompt.replace(/<info>\n([\s\S]*?)<\/info>/, `<info>\n${info}\n</info>`)

  // Replace <post-reference> ... </post-reference>
  finalPrompt = finalPrompt.replace(/<post-reference>\n([\s\S]*?)<\/post-reference>/, `<post-reference>\n${referencePost}\n</post-reference>`)

  return finalPrompt
}