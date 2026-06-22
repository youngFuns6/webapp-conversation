import type { AppInfo } from '@/types/app'

function resolveApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (apiUrl)
  { return apiUrl }

  const consoleUrl = process.env.DIFY_CONSOLE_API_URL?.trim()
  if (consoleUrl)
  { return consoleUrl }

  return ''
}

export const APP_ID = `${process.env.NEXT_PUBLIC_APP_ID}`
export const API_KEY = `${process.env.NEXT_PUBLIC_APP_KEY}`
export const API_URL = resolveApiUrl()
export const PUBLIC_APP_ID = process.env.NEXT_PUBLIC_PUBLIC_APP_ID?.trim() || APP_ID
export const PUBLIC_APP_KEY = process.env.NEXT_PUBLIC_PUBLIC_APP_KEY?.trim() || API_KEY

export type ChatAccessMode = 'internal' | 'public'

/** 访客聊天传入 Dify 的 inputs，工作流据此跳过长期记忆 */
export const GUEST_CHAT_INPUTS: Record<string, string> = {
  enable_long_term_memory: 'false',
  is_guest: 'true',
}

/** 内部登录用户传入 Dify 的 inputs */
export const INTERNAL_CHAT_INPUTS: Record<string, string> = {
  enable_long_term_memory: 'true',
  is_guest: 'false',
}

export function getChatInputsForMode(mode: ChatAccessMode): Record<string, string> {
  return mode === 'public' ? GUEST_CHAT_INPUTS : INTERNAL_CHAT_INPUTS
}

export function getClientAppId(mode: ChatAccessMode = 'internal'): string {
  return mode === 'public' ? PUBLIC_APP_ID : APP_ID
}

export function getClientAppCredentials(mode: ChatAccessMode = 'internal') {
  return {
    appId: getClientAppId(mode),
    apiKey: mode === 'public' ? PUBLIC_APP_KEY : API_KEY,
  }
}

export const APP_INFO: AppInfo = {
  title: '',
  description: '',
  copyright: '',
  privacy_policy: '',
  default_language: 'zh-Hans',
  disable_session_same_site: false, // set it to true if you want to embed the chatbot in an iframe
  enable_user_login: process.env.NEXT_PUBLIC_ENABLE_USER_LOGIN === 'true',
}

/** Cookie names for authenticated user session */
export const AUTH_COOKIE_TOKEN = 'dify_auth_token'
export const AUTH_COOKIE_USER = 'dify_auth_user'

/** Dify console API base URL (without /v1), used for login */
export const DIFY_CONSOLE_API_URL = process.env.DIFY_CONSOLE_API_URL || ''

export function getDifyApiBase(): string {
  const url = API_URL || ''
  return url.replace(/\/v1\/?$/, '')
}

export function getApiConfigError(): string | null {
  if (!APP_ID || APP_ID === 'undefined')
  { return 'NEXT_PUBLIC_APP_ID is not configured' }
  if (!API_KEY || API_KEY === 'undefined')
  { return 'NEXT_PUBLIC_APP_KEY is not configured' }
  if (!API_URL) {
    return 'NEXT_PUBLIC_API_URL is not configured (e.g. https://dify.dongnanedu.com/v1)'
  }
  try {
    // eslint-disable-next-line no-new -- validate URL format
    new URL(API_URL)
  }
  catch {
    return `NEXT_PUBLIC_API_URL is invalid: ${API_URL}`
  }
  return null
}

export const isShowPrompt = false
export const promptTemplate = 'I want you to act as a javascript console.'

export const API_PREFIX = '/webapp/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
