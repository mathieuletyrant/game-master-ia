let currentUtterance: SpeechSynthesisUtterance | null = null

// Strip markdown so TTS doesn't read asterisks, hashes, etc.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`(.+?)`/gs, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
}

export function speak(text: string, onEnd?: () => void): void {
  if (!window.speechSynthesis) return

  // Cancel any current speech
  window.speechSynthesis.cancel()
  currentUtterance = null

  const utterance = new SpeechSynthesisUtterance(stripMarkdown(text))
  utterance.lang = 'fr-FR'
  utterance.rate = 0.9
  utterance.pitch = 0.85
  utterance.volume = 1

  // Prefer a French voice if available
  const voices = window.speechSynthesis.getVoices()
  const frenchVoice = voices.find(
    (v) => v.lang.startsWith('fr') && !v.name.includes('Google'),
  ) ?? voices.find((v) => v.lang.startsWith('fr'))
  if (frenchVoice) utterance.voice = frenchVoice

  if (onEnd) utterance.onend = onEnd

  currentUtterance = utterance

  // Chrome bug: calling speak() immediately after cancel() silently fails.
  // A small delay lets the browser process the cancel before starting a new utterance.
  setTimeout(() => {
    if (!window.speechSynthesis) return
    if (window.speechSynthesis.paused) window.speechSynthesis.resume()
    window.speechSynthesis.speak(utterance)
  }, 100)
}

// Must be called once from a user gesture to unlock TTS in Chrome.
export function unlockTTS(): void {
  if (!window.speechSynthesis) return
  const u = new SpeechSynthesisUtterance('')
  window.speechSynthesis.speak(u)
  window.speechSynthesis.cancel()
}

export function stop(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
}

export function isSpeaking(): boolean {
  return window.speechSynthesis?.speaking ?? false
}

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Warm up voices (browsers load them asynchronously)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // voices loaded
  }
  window.speechSynthesis.getVoices()
}
