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
    principlesWriteCut,
    situationPrompt,
    systemPrompt,
    textBodyInstructions,
    titleInstructions,
    vocabularyPrompt
} from "./system-prompts"

const telegramSpecificInstructions = `<telegram-instructions>
It will posted on Telegram. 
${/* - keep under 4096 characters (but don't force to near the limit, do as much text as necessary) */``}
- use telegram-formatting-instructions to properly format the text 
${/* - Offer 3 drastically different versions of the post (firstsentence + textbody). Make one version which must be maximally close to the reference but in Russian */``}
- Visually add structure with bullet, dashes, relevant emojies
- Be highly structured
- Don't be lazy and output the answer in full. If it's a long list of items in reference post, be 100% sure to post all of the items on the list.

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
${principlesWriteCut}
${telegramSpecificInstructions}
${defaultInfo}
${defaultPostReference}`