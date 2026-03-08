type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList
}

type SpeechRecognitionErrorEvent = {
  error: string
}

type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult
  length: number
}

type SpeechRecognitionResult = {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

type SpeechRecognitionAlternative = {
  transcript: string
}

function createRecognition(): SpeechRecognitionLike | null {
  const SpeechRecognition =
    (window as Record<string, unknown>).SpeechRecognition as
      | (new () => SpeechRecognitionLike)
      | undefined ??
    (window as Record<string, unknown>).webkitSpeechRecognition as
      | (new () => SpeechRecognitionLike)
      | undefined

  if (!SpeechRecognition) return null
  return new SpeechRecognition()
}

export function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
}

export interface STTSession {
  stop(): void
}

export function startListening(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void,
): STTSession | null {
  const recognition = createRecognition()
  if (!recognition) {
    onError('speech_recognition_unavailable')
    return null
  }

  recognition.lang = 'fr-FR'
  recognition.continuous = false
  recognition.interimResults = true

  recognition.onresult = (e) => {
    const result = e.results[e.results.length - 1]
    if (!result) return
    const transcript = result[0]?.transcript ?? ''
    onResult(transcript, result.isFinal)
  }

  recognition.onerror = (e) => {
    onError(e.error)
  }

  recognition.onend = onEnd

  recognition.start()

  return {
    stop() {
      recognition.stop()
    },
  }
}
