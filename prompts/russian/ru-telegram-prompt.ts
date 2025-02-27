import {
    audiencePrompt,
    defaultInfo,
    defaultInformationToSummarize,
    defaultPostReference,
    principlesWriteCut,
    situationPrompt,
    systemPrompt,
    textBodyInstructions,
    titleInstructions,
    vocabularyPrompt
} from "./ru-system-prompts"

const telegramSpecificInstructions = `<telegram-instructions>
It will posted on Telegram. 
- use telegram-formatting-instructions to properly format the text 
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
Links: do not format links as links, just write the link right below the link name.

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
${defaultInformationToSummarize}
${defaultPostReference}`