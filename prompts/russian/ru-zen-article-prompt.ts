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

const zenArticleSpecificInstructions = `<zen-article-instructions>
It will be posted on Yandex Zen as a full article: 
- minimum 7000 characters
- use Zen formatting (markdown supported)
- Include proper article structure with headings
- Add table of contents
- Focus on depth and comprehensive coverage
</zen-article-instructions>`

export const zenArticlePrompt = `${systemPrompt}
${audiencePrompt}
${vocabularyPrompt}
${situationPrompt}
${titleInstructions}
${textBodyInstructions}
${principlesWriteCut}
${zenArticleSpecificInstructions}
${defaultInfo}
${defaultInformationToSummarize}
${defaultPostReference}`