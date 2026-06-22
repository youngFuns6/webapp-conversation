'use client'
import type { FC } from 'react'
import React from 'react'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import StreamingCursor from './streaming-cursor'
import cn from '@/utils/classnames'

export interface StreamingContentProps {
  content: string
  isStreaming?: boolean
  className?: string
}

/** Renders SSE content as it arrives from the server. */
const StreamingContent: FC<StreamingContentProps> = ({
  content,
  isStreaming = false,
  className,
}) => {
  if (!content && isStreaming) {
    return (
      <div className={cn('py-1', className)}>
        <StreamingCursor />
      </div>
    )
  }

  if (isStreaming) {
    return (
      <div className={cn('whitespace-pre-wrap break-words text-[15px] leading-7', className || 'text-gray-800')}>
        {content}
        <StreamingCursor />
      </div>
    )
  }

  if (!content)
  { return null }

  return <StreamdownMarkdown content={content} className={className} />
}

export default React.memo(StreamingContent)
