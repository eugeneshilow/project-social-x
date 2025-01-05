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
} from "./ru-system-prompts"

const zenPostSpecificInstructions = `<zen-post-instructions>
It will be posted on Yandex Zen as a post: 
- keep under 5000 characters
- use Zen formatting (markdown supported)
- Offer 2 different versions of the post
- Focus on engagement and readability
</zen-post-instructions>`

export const zenPostPrompt = `${systemPrompt}
${audiencePrompt}
${vocabularyPrompt}
${situationPrompt}
${titleInstructions}
${textBodyInstructions}
${principlesWriteCut}
${zenPostSpecificInstructions}
${defaultInfo}
${defaultPostReference}`