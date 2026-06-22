import type { NextRequest } from 'next/server'
import { getAuthUserFromRequest } from '@/app/api/utils/auth'
import { APP_INFO } from '@/config'

export async function GET(request: NextRequest) {
  if (!APP_INFO.enable_user_login) {
    return Response.json({ logged_in: true, user: null })
  }

  const user = getAuthUserFromRequest(request)
  return Response.json({
    logged_in: Boolean(user),
    user,
  })
}
