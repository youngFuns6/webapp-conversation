import { API_PREFIX } from '@/config'

export interface AuthUser {
  email: string
  name?: string
}

export async function fetchAuthStatus(): Promise<{ logged_in: boolean, user: AuthUser | null }> {
  const res = await fetch(`${API_PREFIX}/auth/me`, { credentials: 'include' })
  if (!res.ok)
  { return { logged_in: false, user: null } }
  return res.json()
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_PREFIX}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()
  if (!res.ok)
  { throw new Error(data?.message || 'Login failed') }

  return data.user
}

export async function logout(): Promise<void> {
  await fetch(`${API_PREFIX}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}
