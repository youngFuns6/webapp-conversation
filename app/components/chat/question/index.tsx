'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'
import s from '../style.module.css'

import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & {
  imgSrcs?: string[]
  userAvatarLetter?: string
}

const Question: FC<IQuestionProps> = ({ id, content, useCurrentUserAvatar, userAvatarLetter, imgSrcs }) => {
  return (
    <div className='flex items-start justify-end gap-3' key={id}>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-sm px-4 py-3 [&_*]:text-white [&_a]:text-white [&_code]:bg-white/20">
          {imgSrcs && imgSrcs.length > 0 && (
            <div className="mb-2">
              <ImageGallery srcs={imgSrcs} />
            </div>
          )}
          <StreamdownMarkdown content={content} />
        </div>
      </div>
      {useCurrentUserAvatar
        ? (
          <div className='w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-medium shadow-sm'>
            {userAvatarLetter || 'U'}
          </div>
        )
        : (
          <div className={`${s.questionIcon} w-9 h-9 shrink-0 rounded-full shadow-sm`} />
        )}
    </div>
  )
}

export default React.memo(Question)
