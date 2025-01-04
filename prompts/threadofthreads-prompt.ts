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

const threadsOfThreadsSpecificInstructions = `

<!-- Additional instructions for a chain of threads -->
<threads-instructions>
We want to publish a sequence (chain) of multiple posts on Threads. 
Keep each post within 500 characters.

Use the same approach as the standard Threads Prompt, but each final "post" is effectively a separate message in the chain. 
Keep each separate post succinct, while ensuring the chain as a whole provides comprehensive coverage.
Posts in the reference might be separated by --post1--, --post2--, etc.

If there is some sort of CTA (like a link of something like that), mention it in the post (something like - "Ссылка в комментариях"),
And make a second post with that CTA. 

Also, last post should be something to prompt the user to subscribe or like or comment or save or repost or a some combination of those. Also you may byte people for comments if it makes sense.

Don't be lazy and output the answer in full. If it's a long list of items in reference post, make sure to post all of the items on the list.

In the end of every post add 1 relevant #tag (make use of Russian tags as well like #ИИ). Separate by an empty line before the tag.

</threads-instructions>
`

export const threadofthreadsPrompt = `${systemPrompt}
${audiencePrompt}
${vocabularyPrompt}
${situationPrompt}
${titleInstructions}
${textBodyInstructions}
${principlesWriteCut}
${threadsOfThreadsSpecificInstructions}
${defaultInfo}
${defaultPostReference}`