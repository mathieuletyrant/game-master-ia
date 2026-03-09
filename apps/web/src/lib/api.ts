const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function streamAIResponse(
  gameId: string,
  actionId: string,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  params?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${SERVER_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, actionId, params, messages }),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    fullText += chunk
    onChunk(chunk)
  }

  return fullText
}
