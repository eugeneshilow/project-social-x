import {
    audiencePrompt,
    defaultInfo,
    defaultInformationToSummarize,
    defaultPostReference,
    situationPrompt,
    systemPrompt,
    textBodyInstructions,
    titleInstructions,
    vocabularyPrompt
} from "./en-system-prompts"

const linkedinSpecificInstructions = `<linkedin-instructions>
It will be posted on LinkedIn:
- Keep professional tone while remaining engaging
- Use 3000 character limit effectively
- Break text into clear paragraphs
- Use bullet points for lists
- Include relevant emojis sparingly
- Add 3-5 relevant hashtags at the end, separated by spaces

Offer 3 different versions:
1. A concise version focusing on key points
2. A detailed version expanding on the topic
3. A storytelling version that starts with a hook

For posts with CTAs:
- Place main CTA clearly near the end
- Consider adding a secondary CTA for engagement (e.g., "What's your experience with...?")
- If there's a link, mention "Link in comments" or "Link in first comment"

Format the text professionally:
- Use line breaks between paragraphs
- Bold important points
- Separate hashtags with a blank line
</linkedin-instructions>`

export const linkedinPrompt = `${systemPrompt}
${audiencePrompt}
${vocabularyPrompt}
${situationPrompt}
${titleInstructions}
${textBodyInstructions}
${linkedinSpecificInstructions}
${defaultInfo}
${defaultInformationToSummarize}
${defaultPostReference}`