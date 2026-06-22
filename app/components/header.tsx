import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  userEmail?: string
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
  onLogout?: () => void
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  userEmail,
  onShowSideBar,
  onCreateNewChat,
  onLogout,
}) => {
  const { t } = useTranslation()
  return (
    <div className="shrink-0 flex items-center justify-between h-14 px-4 bg-white/90 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      {isMobile
        ? (
          <div
            className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-gray-500" />
          </div>
        )
        : <div></div>}
      <div className='flex items-center space-x-2'>
        <AppIcon size="small" />
        <div className=" text-sm text-gray-800 font-bold">{title}</div>
      </div>
      {isMobile
        ? (
          <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onCreateNewChat?.()} >
            <PencilSquareIcon className="h-4 w-4 text-gray-500" />
          </div>)
        : (
          <div className='flex items-center gap-3'>
            {userEmail && (
              <span className="text-xs text-gray-500 max-w-[160px] truncate" title={userEmail}>
                {userEmail}
              </span>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {t('app.auth.logout')}
              </button>
            )}
          </div>
        )}
    </div>
  )
}

export default React.memo(Header)
