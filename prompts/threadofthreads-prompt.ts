import { threadsPrompt } from "./threads-prompt"

/**
 * threadofthreads-prompt.ts
 * 
 * This prompt is based on threadsPrompt but tailored for a multi-thread (chain) approach on Threads.
 */

export const threadofthreadsPrompt = `
${threadsPrompt}

<!-- Additional instructions for a chain of threads -->
<threads-instructions>
We want to publish a sequence (chain) of multiple posts on Threads. 
Use the same approach as the standard Threads Prompt, but each final "post" is effectively a separate message in the chain. 
Keep each separate post succinct, while ensuring the chain as a whole provides comprehensive coverage.
Posts in the reference might be separated by --post1--, --post2--, etc.
</threads-instructions>
`