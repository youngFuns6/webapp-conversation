import { buildClearAuthCookies } from '@/app/api/utils/auth'

export async function POST() {
  const headers = new Headers()
  buildClearAuthCookies().forEach(cookie => headers.append('Set-Cookie', cookie))
  return Response.json({ result: 'success' }, { headers })
}
