import type { NextRequest } from 'next/server'
import {
  AUTH_COOKIE_TOKEN,
  AUTH_COOKIE_USER,
  DIFY_CONSOLE_API_URL,
  getDifyApiBase,
} from '@/config'
import { encryptPassword } from '@/utils/encryption'

export interface AuthUser {
  email: string
  name?: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function buildCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

function buildExpiredCookie(name: string): string {
  return `${name}=; Path=/; Max-Age=0; HttpOnly`
}

function getConsoleApiBase(): string {
  const url = (DIFY_CONSOLE_API_URL || getDifyApiBase()).trim()
  return url.replace(/\/v1\/?$/, '')
}

async function parseDifyErrorMessage(res: Response): Promise<string | null> {
  try {
    const body = await res.json()
    return body?.message || null
  }
  catch {
    return null
  }
}

function parseAccessTokenFromSetCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader)
  { return null }

  const cookies = setCookieHeader.split(/,(?=\s*[^;]+=)/)
  for (const cookie of cookies) {
    const match = cookie.trim().match(/(?:^|;\s*)(?:__Host-)?access_token=([^;]+)/i)
    if (match?.[1])
    { return decodeURIComponent(match[1]) }
  }
  return null
}

function extractAccessTokenFromResponse(res: Response): string | null {
  if (typeof res.headers.getSetCookie === 'function') {
    for (const cookie of res.headers.getSetCookie()) {
      const match = cookie.match(/(?:^|;\s*)(?:__Host-)?access_token=([^;]+)/i)
      if (match?.[1])
      { return decodeURIComponent(match[1]) }
    }
  }

  return parseAccessTokenFromSetCookie(res.headers.get('set-cookie'))
}

async function fetchConsoleProfile(token: string): Promise<AuthUser | null> {
  const base = getConsoleApiBase()
  const res = await fetch(`${base}/console/api/account/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok)
  { return null }

  const data = await res.json()
  const email = data?.email
  if (!email)
  { return null }

  return {
    email: String(email).toLowerCase(),
    name: data?.name,
  }
}

async function loginViaWebApi(email: string, password: string): Promise<{ session: AuthSession | null, error?: string }> {
  const base = getDifyApiBase()
  const res = await fetch(`${base}/api/web/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: encryptPassword(password) }),
  })

  if (!res.ok) {
    return { session: null, error: await parseDifyErrorMessage(res) || undefined }
  }

  const body = await res.json()
  const token = body?.data?.access_token
  if (!token)
  { return { session: null } }

  return {
    session: {
      token,
      user: { email: email.toLowerCase() },
    },
  }
}

async function loginViaConsoleApi(email: string, password: string): Promise<{ session: AuthSession | null, error?: string }> {
  const base = getConsoleApiBase()
  const res = await fetch(`${base}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: encryptPassword(password),
      remember_me: true,
    }),
  })

  if (!res.ok) {
    return { session: null, error: await parseDifyErrorMessage(res) || undefined }
  }

  const body = await res.json()
  if (body?.result !== 'success')
  { return { session: null, error: body?.message } }

  const token = extractAccessTokenFromResponse(res)
  if (!token)
  { return { session: null, error: 'Login succeeded but token was not received' } }

  const profile = await fetchConsoleProfile(token)
  if (!profile) {
    return {
      session: {
        token,
        user: { email: email.toLowerCase() },
      },
    }
  }

  return { session: { token, user: profile } }
}

export async function authenticateWithDify(email: string, password: string): Promise<AuthSession> {
  const { session: webSession, error: webError } = await loginViaWebApi(email, password)
  if (webSession)
  { return webSession }

  const { session: consoleSession, error: consoleError } = await loginViaConsoleApi(email, password)
  if (consoleSession)
  { return consoleSession }

  throw new Error(consoleError || webError || 'Invalid email or password')
}

export function buildAuthCookies(session: AuthSession): string[] {
  return [
    buildCookie(AUTH_COOKIE_TOKEN, session.token),
    buildCookie(AUTH_COOKIE_USER, session.user.email),
  ]
}

export function buildClearAuthCookies(): string[] {
  return [
    buildExpiredCookie(AUTH_COOKIE_TOKEN),
    buildExpiredCookie(AUTH_COOKIE_USER),
  ]
}

export function getAuthUserFromRequest(request: NextRequest): AuthUser | null {
  const email = request.cookies.get(AUTH_COOKIE_USER)?.value
  if (!email)
  { return null }

  return { email: decodeURIComponent(email) }
}

export function getAuthTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get(AUTH_COOKIE_TOKEN)?.value
  return token ? decodeURIComponent(token) : null
}
