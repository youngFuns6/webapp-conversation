import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getApiConfigError } from '@/config'
import { getAppCredentials, resolveChatMode } from '@/app/api/utils/chat-context'

export async function GET(request: NextRequest) {
  const configError = getApiConfigError()
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 400 })
  }

  const { apiKey, apiUrl } = getAppCredentials(resolveChatMode(request))

  try {
    const res = await fetch(`${apiUrl}/site`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch site info' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  }
  catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch site info' }, { status: 500 })
  }
}
