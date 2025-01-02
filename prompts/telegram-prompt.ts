/**
 * telegram-prompt.ts
 * 
 * This file stores the system prompt for Telegram,
 * plus any placeholders for audience, vocabulary, instructions, etc.
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

const telegramSpecificInstructions = `<telegram-instructions>
It will posted on Telegram. 
- keep under 4096 characters (but don't force to near the limit, do as much text as necessary)
- use telegram-formatting-instructions to properly format the text 
- Offer 3 drastically different versions of the post (firstsentence + textbody). Make one version which must be maximally close to the reference but in Russian
- Visually add structure with bullet, dashes, relevant emojies
- Be structured

<telegram-formatting-instructions>
Bold: **Bold text**
Italic: __Italic text__ 
Strikethrough: ~~Strikethrough text~~
Monospace (inline code): \`Inline code\`
Code Block: \`\`\` Multi-line code \`\`\`
Hidden Text (to leverage curiousity): ||скрытый текст||

Escape special chars:
Use \\ before _, *, ~, etc., when you want them to appear literally (e.g. \\* becomes *).
</telegram-formatting-instructions>
</telegram-instructions>`

export const telegramPrompt = `${systemPrompt}
${audiencePrompt}
${vocabularyPrompt}
${situationPrompt}
${titleInstructions}
${textBodyInstructions}
${telegramSpecificInstructions}
${defaultInfo}
${defaultPostReference}`