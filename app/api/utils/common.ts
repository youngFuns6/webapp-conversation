import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { APP_INFO, getApiConfigError } from '@/config'
import { getAuthUserFromRequest } from '@/app/api/utils/auth'
import { getAppCredentials, resolveChatMode } from '@/app/api/utils/chat-context'

export function getClient(request: NextRequest) {
  const configError = getApiConfigError()
  if (configError)
  { throw new Error(configError) }

  const { apiKey, apiUrl } = getAppCredentials(resolveChatMode(request))
  return new ChatClient(apiKey, apiUrl)
}

export const getInfo = (request: NextRequest) => {
  const mode = resolveChatMode(request)
  const { appId } = getAppCredentials(mode)
  const sessionId = request.cookies.get('session_id')?.value || v4()
  const authUser = getAuthUserFromRequest(request)

  if (mode === 'public') {
    return {
      mode,
      appId,
      sessionId,
      user: `guest_${appId}:${sessionId}`,
    }
  }

  if (APP_INFO.enable_user_login && authUser) {
    return {
      mode,
      appId,
      sessionId,
      user: `user_${appId}:${authUser.email}`,
      authUser,
    }
  }

  return {
    mode,
    appId,
    sessionId,
    user: `user_${appId}:${sessionId}`,
  }
}

export const setSession = (sessionId: string) => {
  if (APP_INFO.disable_session_same_site)
  { return { 'Set-Cookie': `session_id=${sessionId}; SameSite=None; Secure` } }

  return { 'Set-Cookie': `session_id=${sessionId}` }
}
