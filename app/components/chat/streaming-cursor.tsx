'use client'
import type { FC } from 'react'
import React from 'react'

const StreamingCursor: FC = () => (
  <span
    className="inline-block text-primary-600 font-semibold ml-0.5 align-baseline animate-[cursor-blink_0.8s_step-end_infinite]"
    aria-hidden
  >
    ▋
  </span>
)

export default React.memo(StreamingCursor)
