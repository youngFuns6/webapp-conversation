'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import StreamingContent from './streaming-content'
import cn from '@/utils/classnames'

export interface ThinkBlockProps {
  content: string
  defaultExpanded?: boolean
  isStreaming?: boolean
}

const ThinkBlock: FC<ThinkBlockProps> = ({
  content,
  defaultExpanded = false,
  isStreaming = false,
}) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(defaultExpanded || isStreaming)

  if (!content)
  { return null }

  return (
    <div className="mb-3 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-amber-800 hover:bg-amber-100/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded
          ? <ChevronDownIcon className="w-3.5 h-3.5 shrink-0" />
          : <ChevronRightIcon className="w-3.5 h-3.5 shrink-0" />}
        <span className="flex items-center gap-1.5">
          <span>💭</span>
          <span>{t('app.chat.thinkProcess')}</span>
          {isStreaming && (
            <span className="inline-flex gap-0.5 ml-1">
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </span>
      </button>
      {expanded && (
        <div className={cn(
          'px-3 pb-3 text-[13px] leading-relaxed text-amber-900/80 border-t border-amber-200/50',
          'think-block-content',
        )}
        >
          <StreamingContent
            content={content}
            isStreaming={isStreaming}
            className="!text-[13px] !leading-relaxed !text-amber-900/80"
          />
        </div>
      )}
    </div>
  )
}

export default React.memo(ThinkBlock)
