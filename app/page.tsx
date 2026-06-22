import type { FC } from 'react'
import React from 'react'
import Main from '@/app/components'

const App: FC = () => {
  return <Main mode="internal" />
}

export default React.memo(App)
