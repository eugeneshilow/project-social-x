import {
    audiencePrompt,
    defaultInfo,
    defaultPostReference,
    situationPrompt,
    systemPrompt,
    textBodyInstructions,
    titleInstructions,
    vocabularyPrompt
} from "./en-system-prompts"

const threadsSpecificInstructions = `<threads-instructions>
It will be posted on Threads: 
- keep 500-character limit

Offer 3 drastically different versions of the post (first sentence + text body). Make one version which must be maximally close to the reference.

If there is some sort of CTA (like a link or something like that), mention it in the post (something like - "Link in comments"),
And make a second post with that CTA. 

Also, last post should be something to prompt the user to subscribe or like or comment or save or repost or a some combination of those. You may also encourage comments if it makes sense.

In the end of every post add 1 relevant #tag. Separate by an empty line before the tag.
</threads-instructions>`

export const ENThreadsPrompt = `${systemPrompt}
${audiencePrompt}
${vocabularyPrompt}
${situationPrompt}
${titleInstructions}
${textBodyInstructions}
${threadsSpecificInstructions}
${defaultInfo}
${defaultPostReference}`