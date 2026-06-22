export type ChatAccessMode = 'internal' | 'public'

export const CHAT_MODE_HEADER = 'X-Chat-Mode'

let currentChatMode: ChatAccessMode = 'internal'

export function setChatMode(mode: ChatAccessMode) {
  currentChatMode = mode
}

export function getChatMode(): ChatAccessMode {
  return currentChatMode
}
