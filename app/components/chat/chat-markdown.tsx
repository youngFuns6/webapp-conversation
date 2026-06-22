'use client'
import type { FC } from 'react'
import React from 'react'
import { parseThinkContent } from '@/utils/think-content'
import ThinkBlock from './think-block'
import StreamingContent from './streaming-content'
import LoadingAnim from './loading-anim'

export interface ChatMarkdownProps {
  content: string
  isStreaming?: boolean
}

const ChatMarkdown: FC<ChatMarkdownProps> = ({ content, isStreaming = false }) => {
  const { thinkParts, answer } = parseThinkContent(content)
  const hasVisibleContent = thinkParts.length > 0 || answer

  if (!hasVisibleContent && isStreaming) {
    return (
      <div className="flex items-center gap-2 py-1">
        <LoadingAnim type="text" />
      </div>
    )
  }

  const isThinking = isStreaming && thinkParts.length > 0 && !answer

  return (
    <div>
      {thinkParts.map((part, index) => (
        <ThinkBlock
          key={index}
          content={part}
          defaultExpanded={isStreaming && index === thinkParts.length - 1}
          isStreaming={isStreaming && index === thinkParts.length - 1 && isThinking}
        />
      ))}
      {(answer || (isStreaming && !isThinking)) && (
        <StreamingContent
          content={answer}
          isStreaming={isStreaming && !isThinking}
        />
      )}
    </div>
  )
}

export default React.memo(ChatMarkdown)
