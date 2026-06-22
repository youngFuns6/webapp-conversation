const THINK_TAG = 'think|redacted_reasoning|redacted_thinking'
const THINK_OPEN = new RegExp(`<(?:${THINK_TAG})>`, 'i')
const THINK_CLOSE = new RegExp(`<\\/(?:${THINK_TAG})>`, 'i')
const THINK_COMPLETE = new RegExp(`<(?:${THINK_TAG})>([\\s\\S]*?)<\\/(?:${THINK_TAG})>`, 'gi')

export interface ParsedThinkContent {
  thinkParts: string[]
  answer: string
}

export function parseThinkContent(content: string): ParsedThinkContent {
  if (!content)
  { return { thinkParts: [], answer: '' } }

  const thinkParts: string[] = []
  let answer = content

  answer = answer.replace(THINK_COMPLETE, (_, think: string) => {
    const trimmed = think.trim()
    if (trimmed)
    { thinkParts.push(trimmed) }
    return ''
  })

  const openIndex = answer.search(THINK_OPEN)
  if (openIndex !== -1) {
    const before = answer.slice(0, openIndex).trim()
    const afterOpen = answer.slice(openIndex).replace(THINK_OPEN, '')
    const closeIndex = afterOpen.search(THINK_CLOSE)
    if (closeIndex === -1) {
      const streamingThink = afterOpen.trim()
      if (streamingThink)
      { thinkParts.push(streamingThink) }
      answer = before
    }
  }

  return {
    thinkParts,
    answer: answer.trim(),
  }
}
