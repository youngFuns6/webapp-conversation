'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import Textarea from 'rc-textarea'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

export interface IChatProps {
  chatList: ChatItem[]
  feedbackDisabled?: boolean
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  userAvatarLetter?: string
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  userAvatarLetter,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
  scrollContainerRef,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)
  const internalScrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatList, isResponding])

  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  const hasAttachments = files.length > 0 || attachmentFiles.length > 0
  const showImageUpload = visionConfig?.enabled
  const showFileUpload = fileConfig?.enabled

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  const canSend = query.trim().length > 0 && !isResponding

  const setScrollRef = (el: HTMLDivElement | null) => {
    internalScrollRef.current = el
    if (scrollContainerRef && 'current' in scrollContainerRef)
    { (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el }
  }

  return (
    <div className={cn('flex flex-col h-full min-h-0', !feedbackDisabled && 'px-1')}>
      <div
        ref={setScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-6 px-3 sm:px-4 py-4"
      >
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return (
              <Answer
                key={item.id}
                item={item}
                feedbackDisabled={feedbackDisabled}
                onFeedback={onFeedback}
                isResponding={isResponding && isLast}
                suggestionClick={suggestionClick}
              />
            )
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              userAvatarLetter={userAvatarLetter}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(file => file.url) : []}
            />
          )
        })}
        <div ref={messagesEndRef} className="h-px shrink-0" />
      </div>

      {!isHideSendInput && (
        <div className="shrink-0 border-t border-gray-200/80 bg-white/95 backdrop-blur-sm px-3 sm:px-4 py-3">
          <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
            {hasAttachments && (
              <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-gray-50/50 space-y-2">
                {showImageUpload && files.length > 0 && (
                  <ImageList
                    list={files}
                    onRemove={onRemove}
                    onReUpload={onReUpload}
                    onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                    onImageLinkLoadError={onImageLinkLoadError}
                  />
                )}
                {showFileUpload && attachmentFiles.length > 0 && (
                  <FileUploaderInAttachmentWrapper
                    fileConfig={fileConfig}
                    value={attachmentFiles}
                    onChange={setAttachmentFiles}
                    compact
                  />
                )}
              </div>
            )}

            <div className="flex items-end gap-2 p-3">
              {(showImageUpload || showFileUpload) && (
                <div className="flex items-center gap-1.5 shrink-0 pb-1">
                  {showImageUpload && (
                    <ChatImageUploader
                      settings={visionConfig}
                      onUpload={onUpload}
                      disabled={files.length >= visionConfig.number_limits}
                    />
                  )}
                  {showFileUpload && (
                    <FileUploaderInAttachmentWrapper
                      fileConfig={fileConfig}
                      value={attachmentFiles}
                      onChange={setAttachmentFiles}
                      compact
                      toolbarOnly
                    />
                  )}
                </div>
              )}

              <Textarea
                className="flex-1 min-h-[44px] max-h-[160px] px-3 py-2.5 text-[15px] leading-6 text-gray-800 placeholder:text-gray-400 bg-transparent outline-none resize-none border-0"
                placeholder={t('app.chat.inputPlaceholder')}
                value={query}
                onChange={handleContentChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                autoSize
              />

              <button
                type="button"
                disabled={!canSend}
                onClick={handleSend}
                className={cn(
                  'shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all mb-0.5',
                  canSend
                    ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700 hover:shadow-lg'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed',
                )}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pb-2.5 text-[11px] text-gray-400">
              {t('common.operation.send')} Enter · {t('common.operation.lineBreak')} Shift Enter
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Chat)
