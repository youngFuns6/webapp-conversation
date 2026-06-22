'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/app/components/base/button'
import AppIcon from '@/app/components/base/app-icon'
import { login } from '@/service/auth'
import type { AuthUser } from '@/service/auth'

export interface LoginProps {
  onSuccess: (user: AuthUser) => void
  appTitle?: string
}

const Login: FC<LoginProps> = ({ onSuccess, appTitle }) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError(t('app.auth.emailPasswordRequired'))
      return
    }

    setLoading(true)
    setError('')
    try {
      const user = await login(email.trim(), password)
      onSuccess(user)
    }
    catch (e: any) {
      setError(e?.message || t('app.auth.loginFailed'))
    }
    finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading)
    { handleSubmit() }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <AppIcon size="large" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">{appTitle || ' '}</h1>
          <p className="mt-2 text-sm text-gray-500 text-center">{t('app.auth.loginSubtitle')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('app.auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('app.auth.emailPlaceholder')}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('app.auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('app.auth.passwordPlaceholder')}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="primary"
            className="w-full !h-10"
            loading={loading}
            disabled={loading}
            onClick={handleSubmit}
          >
            {t('app.auth.login')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Login)
