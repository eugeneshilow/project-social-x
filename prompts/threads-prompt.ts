/**
 * threads-prompt.ts
 * 
 * This file stores the system prompt for Threads,
 * plus any placeholders for audience, vocabulary, instructions, etc.
 * 
 * The user or developer can modify these strings as needed
 * for different contexts and platforms.
 */

import {
    audiencePrompt,
    defaultInfo,
    defaultPostReference,
    situationPrompt,
    systemPrompt,
    textBodyInstructions,
    titleInstructions,
    vocabularyPrompt
} from "./system-prompts"

const threadsSpecificInstructions = `<threads-instructions>
It will be posted on Threads: 
- keep 500-character limit

Offer 3 drastically different versions of the post (firstsentence + textbody). Make one version which must be maximally close to the reference but in Russian
</threads-instructions>`

export const threadsPrompt = `${systemPrompt}
${audiencePrompt}
${vocabularyPrompt}
${situationPrompt}
${titleInstructions}
${textBodyInstructions}
${threadsSpecificInstructions}
${defaultInfo}
${defaultPostReference}`