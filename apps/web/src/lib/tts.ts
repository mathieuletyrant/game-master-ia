const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'

// Strip markdown so TTS doesn't read asterisks, hashes, etc.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`(.+?)`/gs, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
}

// Tracks whether the server TTS (ElevenLabs) is available.
// undefined = not yet probed, true/false = known state.
let serverTTSAvailable: boolean | undefined = undefined

let currentAudio: HTMLAudioElement | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null

async function probeServerTTS(): Promise<boolean> {
  if (serverTTSAvailable !== undefined) return serverTTSAvailable
  try {
    const res = await fetch(`${SERVER_URL}/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Empty text to get a 400 (configured) vs 503 (not configured) response
      body: JSON.stringify({ text: '' }),
    })
    // 503 means ElevenLabs key not set; any other status means it's configured
    serverTTSAvailable = res.status !== 503
  } catch {
    serverTTSAvailable = false
  }
  return serverTTSAvailable
}

async function speakWithServer(text: string, onEnd?: () => void): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_URL}/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) return false

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio

    audio.onended = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      onEnd?.()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
    }
    await audio.play()
    return true
  } catch {
    return false
  }
}

function speakWithBrowser(text: string, onEnd?: () => void): void {
  if (!window.speechSynthesis) return

  window.speechSynthesis.cancel()
  currentUtterance = null

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.rate = 0.9
  utterance.pitch = 0.85
  utterance.volume = 1

  const voices = window.speechSynthesis.getVoices()
  const frenchVoice =
    voices.find((v) => v.lang.startsWith('fr') && !v.name.includes('Google')) ??
    voices.find((v) => v.lang.startsWith('fr'))
  if (frenchVoice) utterance.voice = frenchVoice

  if (onEnd) utterance.onend = onEnd
  currentUtterance = utterance

  // Chrome bug: calling speak() immediately after cancel() silently fails.
  setTimeout(() => {
    if (!window.speechSynthesis) return
    if (window.speechSynthesis.paused) window.speechSynthesis.resume()
    window.speechSynthesis.speak(utterance)
  }, 100)
}

export function speak(text: string, onEnd?: () => void): void {
  stop()
  const cleaned = stripMarkdown(text)

  probeServerTTS().then((hasServer) => {
    if (hasServer) {
      speakWithServer(cleaned, onEnd).then((ok) => {
        if (!ok) speakWithBrowser(cleaned, onEnd)
      })
    } else {
      speakWithBrowser(cleaned, onEnd)
    }
  })
}

// Must be called once from a user gesture to unlock TTS in Chrome.
export function unlockTTS(): void {
  if (!window.speechSynthesis) return
  const u = new SpeechSynthesisUtterance('')
  window.speechSynthesis.speak(u)
  window.speechSynthesis.cancel()
}

export function stop(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
}

export function isSpeaking(): boolean {
  if (currentAudio && !currentAudio.paused) return true
  return window.speechSynthesis?.speaking ?? false
}

export function isSupported(): boolean {
  return true // always supported: server TTS or browser fallback
}

// Warm up browser voices asynchronously
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {}
  window.speechSynthesis.getVoices()
}
