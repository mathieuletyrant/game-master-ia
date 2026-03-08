let currentUtterance: SpeechSynthesisUtterance | null = null

export function speak(text: string, onEnd?: () => void): void {
  if (!window.speechSynthesis) return

  stop()

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
  window.speechSynthesis.speak(utterance)
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
