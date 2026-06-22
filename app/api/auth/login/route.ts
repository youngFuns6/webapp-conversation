import type { NextRequest } from 'next/server'
import {
  authenticateWithDify,
  buildAuthCookies,
} from '@/app/api/utils/auth'
import { setSession } from '@/app/api/utils/common'
import { v4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body?.email?.trim()
    const password = body?.password

    if (!email || !password) {
      return Response.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const session = await authenticateWithDify(email, password)
    const sessionId = request.cookies.get('session_id')?.value || v4()
    const headers = new Headers()
    buildAuthCookies(session).forEach(cookie => headers.append('Set-Cookie', cookie))
    const sessionCookie = setSession(sessionId)
    Object.entries(sessionCookie).forEach(([key, value]) => headers.append(key, value))

    return Response.json(
      { result: 'success', user: session.user },
      { headers },
    )
  }
  catch (e: any) {
    return Response.json(
      { message: e?.message || 'Login failed' },
      { status: 401 },
    )
  }
}
