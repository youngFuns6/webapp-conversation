import type { FC } from 'react'
import React from 'react'
import Main from '@/app/components'

const PublicApp: FC = () => {
  return <Main mode="public" />
}

export default React.memo(PublicApp)
