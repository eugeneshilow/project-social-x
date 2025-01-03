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
    principlesWriteCut,
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

If there is some sort of CTA (like a link of something like that), mention it in the post (something like - "Ссылка в комментариях"),
And make a second post with that CTA. 

Also, last post should be something to prompt the user to subscribe or like or comment or save or repost or a some combination of those. Also you may byte people for comments if it makes sense.
</threads-instructions>`

export const threadsPrompt = `${systemPrompt}
${audiencePrompt}
${vocabularyPrompt}
${situationPrompt}
${titleInstructions}
${textBodyInstructions}
${principlesWriteCut}
${threadsSpecificInstructions}
${defaultInfo}
${defaultPostReference}`