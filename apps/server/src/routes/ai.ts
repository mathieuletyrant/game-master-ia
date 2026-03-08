import { Hono } from 'hono'
import { buildSystemPrompt } from '@game-master/games/loup-garou'
import type { LoupGarouState } from '@game-master/games/loup-garou'
import { streamGameMaster } from '../lib/claude.js'
import type { MessageParam } from '../lib/claude.js'
import { isElevenLabsConfigured, synthesizeSpeech } from '../lib/tts.js'

const ai = new Hono()

interface ChatRequest {
  messages: MessageParam[]
  gameState: LoupGarouState
  gameId: string
}

ai.post('/chat', async (c) => {
  const body = await c.req.json<ChatRequest>()
  const { messages, gameState, gameId } = body

  if (gameId !== 'loup-garou') {
    return c.json({ error: `Game "${gameId}" not supported yet.` }, 400)
  }

  const systemPrompt = buildSystemPrompt(gameState)

  let textStream: ReadableStream<string>
  try {
    textStream = await streamGameMaster(systemPrompt, messages)
  } catch (err) {
    console.error('Claude API error:', err)
    return c.json({ error: 'Failed to reach AI service.' }, 502)
  }

  const encoder = new TextEncoder()
  const body2 = new ReadableStream({
    async start(controller) {
      const reader = textStream.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        controller.enqueue(encoder.encode(value))
      }
      controller.close()
    },
  })

  return new Response(body2, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
})

ai.post('/tts', async (c) => {
  if (!isElevenLabsConfigured()) {
    return c.json({ error: 'TTS not configured. Add ELEVENLABS_API_KEY to the server .env.' }, 503)
  }

  const { text } = await c.req.json<{ text: string }>()
  if (!text?.trim()) return c.json({ error: 'text is required' }, 400)

  let audioBuffer: ArrayBuffer
  try {
    audioBuffer = await synthesizeSpeech(text)
  } catch (err) {
    console.error('ElevenLabs TTS error:', err)
    return c.json({ error: 'TTS synthesis failed.' }, 502)
  }

  return new Response(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    },
  })
})

export default ai
