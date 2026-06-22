import type { NextRequest } from 'next/server'
import { API_KEY, API_URL, APP_ID, getChatInputsForMode } from '@/config'

export type ChatAccessMode = 'internal' | 'public'

export const CHAT_MODE_HEADER = 'X-Chat-Mode'

export function resolveChatMode(request: NextRequest): ChatAccessMode {
  return request.headers.get(CHAT_MODE_HEADER) === 'public' ? 'public' : 'internal'
}

export interface AppCredentials {
  appId: string
  apiKey: string
  apiUrl: string
}

export function getAppCredentials(mode: ChatAccessMode): AppCredentials {
  if (mode === 'public') {
    const appId = process.env.NEXT_PUBLIC_PUBLIC_APP_ID?.trim() || APP_ID
    const apiKey = process.env.NEXT_PUBLIC_PUBLIC_APP_KEY?.trim() || API_KEY
    return { appId, apiKey, apiUrl: API_URL }
  }
  return { appId: APP_ID, apiKey: API_KEY, apiUrl: API_URL }
}

export function isGuestUserId(userId: string): boolean {
  return userId.startsWith('guest_')
}

export function mergeChatInputs(
  mode: ChatAccessMode,
  inputs?: Record<string, unknown> | null,
): Record<string, unknown> {
  return {
    ...(inputs || {}),
    ...getChatInputsForMode(mode),
  }
}
