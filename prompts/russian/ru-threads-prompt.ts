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

const threadsSpecificInstructions = `<threads-instructions>
It will be posted on Threads: 
- keep 500-character limit

Offer 3 drastically different versions of the post (firstsentence + textbody). Make one version which must be maximally close to the reference but in Russian

If there is some sort of CTA (like a link of something like that), mention it in the post (something like - "Ссылка в комментариях"),
And make a second post with that CTA. 

Also, last post should be something to prompt the user to subscribe or like or comment or save or repost or a some combination of those. Also you may byte people for comments if it makes sense.

In the end of every post add 1 relevant #tag (make use of Russian tags as well like #ИИ). Separate by an empty line before the tag.
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
${defaultInformationToSummarize}
${defaultPostReference}`