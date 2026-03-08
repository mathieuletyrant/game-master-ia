let currentUtterance: SpeechSynthesisUtterance | null = null

export function speak(text: string, onEnd?: () => void): void {
  if (!window.speechSynthesis) return

  // Cancel any current speech
  window.speechSynthesis.cancel()
  currentUtterance = null

  const utterance = new SpeechSynthesisUtterance(text)
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
