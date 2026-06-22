import type { NextRequest } from 'next/server'
import { getApiConfigError } from '@/config'
import { getAppCredentials, mergeChatInputs, resolveChatMode } from '@/app/api/utils/chat-context'
import { getInfo, setSession } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  const configError = getApiConfigError()
  if (configError) {
    return Response.json({ message: configError }, { status: 400 })
  }

  const body = await request.json()
  const {
    inputs,
    query,
    files,
    conversation_id: conversationId,
    response_mode: responseMode = 'streaming',
  } = body
  const { sessionId, user } = getInfo(request)
  const mode = resolveChatMode(request)
  const { apiKey, apiUrl } = getAppCredentials(mode)

  const payload: Record<string, unknown> = {
    inputs: mergeChatInputs(mode, inputs),
    query,
    user,
    response_mode: responseMode,
    files: files || [],
  }
  if (conversationId)
  { payload.conversation_id = conversationId }

  const difyResponse = await fetch(`${apiUrl}/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!difyResponse.ok) {
    const errorText = await difyResponse.text()
    return new Response(errorText, {
      status: difyResponse.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  Object.entries(setSession(sessionId)).forEach(([key, value]) => headers.set(key, value))

  return new Response(difyResponse.body, {
    status: 200,
    headers,
  })
}
