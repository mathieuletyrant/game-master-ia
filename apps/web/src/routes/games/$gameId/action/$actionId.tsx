import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { GAMES } from '@game-master/games'
import type { GameAction, ActionParam } from '@game-master/games'
import { GameMasterPanel } from '../../../../components/GameMasterPanel'
import { MicButton } from '../../../../components/MicButton'
import { streamAIResponse, type ChatMessage } from '../../../../lib/api'
import { speak, stop as stopTTS, isSupported as ttsSupported, unlockTTS } from '../../../../lib/tts'
import { startListening, isSupported as sttSupported } from '../../../../lib/stt'

interface DisplayMessage {
  id: string
  role: 'ai' | 'user'
  content: string
}

let msgCounter = 0
function nextId() {
  return `msg-${++msgCounter}-${Date.now()}`
}

export function ActionPage() {
  const { gameId, actionId } = useParams({ from: '/games/$gameId/action/$actionId' })

  const game = GAMES.find((g) => g.id === gameId)
  const action = game?.actions.find((a) => a.id === actionId)

  if (!game || !action) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Action introuvable. <Link to="/games/$gameId" params={{ gameId }} className="ml-2 text-amber-400">Retour</Link>
      </div>
    )
  }

  return action.mode === 'qa'
    ? <QAMode gameId={gameId} action={action} />
    : <OneShotMode gameId={gameId} action={action} />
}

// ──────────────────────────────────────────
// One-Shot Mode
// ──────────────────────────────────────────

function OneShotMode({ gameId, action }: { gameId: string; action: GameAction }) {
  const [params, setParams] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {}
    for (const p of action.params ?? []) {
      if (p.default !== undefined) defaults[p.id] = p.default
    }
    return defaults
  })
  const [streamingText, setStreamingText] = useState('')
  const [responseText, setResponseText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isTTSOn, setIsTTSOn] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const triggeredRef = useRef(false)
  const ttsUnlockedRef = useRef(false)

  const hasRequiredParams = action.params?.some((p) => p.required) ?? false

  useEffect(() => {
    function onFirstInteraction() {
      if (ttsUnlockedRef.current) return
      ttsUnlockedRef.current = true
      unlockTTS()
      document.removeEventListener('click', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)
    }
    document.addEventListener('click', onFirstInteraction)
    document.addEventListener('touchstart', onFirstInteraction)
    return () => {
      document.removeEventListener('click', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)
    }
  }, [])

  const trigger = useCallback(async () => {
    if (isStreaming) return
    setIsStreaming(true)
    setStreamingText('')
    setResponseText('')
    stopTTS()

    abortRef.current = new AbortController()
    let fullText = ''

    try {
      fullText = await streamAIResponse(
        gameId,
        action.id,
        [{ role: 'user', content: 'Go' }],
        (chunk) => setStreamingText((prev) => prev + chunk),
        Object.keys(params).length > 0 ? params : undefined,
        abortRef.current.signal,
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        fullText = "Désolé, je n'arrive pas à contacter le serveur."
      }
    }

    setStreamingText('')
    setIsStreaming(false)
    setResponseText(fullText)
    if (fullText && isTTSOn && ttsSupported()) speak(fullText)
  }, [gameId, action.id, params, isStreaming, isTTSOn])

  // Auto-trigger if no required params
  useEffect(() => {
    if (!hasRequiredParams && !triggeredRef.current) {
      triggeredRef.current = true
      trigger()
    }
  }, [hasRequiredParams, trigger])

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-56px)]">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/games/$gameId"
            params={{ gameId }}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            &larr;
          </Link>
          <span className="text-2xl">{action.icon}</span>
          <h1 className="text-lg font-semibold text-slate-100">{action.label}</h1>
        </div>
        {ttsSupported() && (
          <button
            onClick={() => { setIsTTSOn((v) => !v); if (isTTSOn) stopTTS() }}
            className={`text-lg transition-opacity ${isTTSOn ? 'opacity-100' : 'opacity-30'}`}
            title={isTTSOn ? 'Couper la voix' : 'Activer la voix'}
          >
            🔊
          </button>
        )}
      </div>

      {/* Param form */}
      {hasRequiredParams && (
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex flex-wrap items-end gap-3">
            {(action.params ?? []).map((p) => (
              <ParamInput key={p.id} param={p} value={params[p.id]} onChange={(v) => setParams((prev) => ({ ...prev, [p.id]: v }))} />
            ))}
            <button
              onClick={() => { triggeredRef.current = true; trigger() }}
              disabled={isStreaming}
              className="shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
            >
              Valider
            </button>
          </div>
        </div>
      )}

      {/* Response */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isStreaming && (
          <div className="text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">
            {streamingText}
            <span className="inline-block w-0.5 h-4 bg-violet-400 ml-1 animate-pulse" />
          </div>
        )}
        {!isStreaming && responseText && (
          <div className="text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">
            {responseText}
          </div>
        )}
        {!isStreaming && !responseText && !hasRequiredParams && (
          <div className="text-sm text-slate-500">Chargement...</div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Q&A Mode
// ──────────────────────────────────────────

function QAMode({ gameId, action }: { gameId: string; action: GameAction }) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [micState, setMicState] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [isTTSOn, setIsTTSOn] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [micError, setMicError] = useState('')

  const sttSessionRef = useRef<{ stop(): void } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const ttsUnlockedRef = useRef(false)

  useEffect(() => {
    function onFirstInteraction() {
      if (ttsUnlockedRef.current) return
      ttsUnlockedRef.current = true
      unlockTTS()
      document.removeEventListener('click', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)
    }
    document.addEventListener('click', onFirstInteraction)
    document.addEventListener('touchstart', onFirstInteraction)
    return () => {
      document.removeEventListener('click', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)
    }
  }, [])

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isStreaming) return

    const userMsg: DisplayMessage = { id: nextId(), role: 'user', content: userText }
    setDisplayMessages((prev) => [...prev, userMsg])

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userText }]
    setChatHistory(newHistory)

    setIsStreaming(true)
    setStreamingText('')
    stopTTS()

    abortRef.current = new AbortController()
    let fullText = ''

    try {
      fullText = await streamAIResponse(
        gameId,
        action.id,
        newHistory,
        (chunk) => setStreamingText((prev) => prev + chunk),
        undefined,
        abortRef.current.signal,
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        fullText = "Désolé, je n'arrive pas à contacter le serveur."
      }
    }

    setStreamingText('')
    setIsStreaming(false)

    if (fullText) {
      const aiMsg: DisplayMessage = { id: nextId(), role: 'ai', content: fullText }
      setDisplayMessages((prev) => [...prev, aiMsg])
      setChatHistory((prev) => [...prev, { role: 'assistant', content: fullText }])
      if (isTTSOn && ttsSupported()) speak(fullText)
    }
  }, [gameId, action.id, chatHistory, isStreaming, isTTSOn])

  function handleSendText() {
    if (!textInput.trim()) return
    sendMessage(textInput)
    setTextInput('')
  }

  function handleMicPress() {
    if (micState !== 'idle') return
    stopTTS()
    let interim = ''
    setMicState('listening')
    setMicError('')
    setInterimTranscript('')

    sttSessionRef.current = startListening(
      (transcript, isFinal) => {
        interim = transcript
        setInterimTranscript(transcript)
        if (isFinal) {
          sttSessionRef.current?.stop()
        }
      },
      (error) => {
        const errorMessages: Record<string, string> = {
          'not-allowed': 'Accès au micro refusé. Autorisez le micro dans votre navigateur.',
          'no-speech': 'Aucune parole détectée.',
          'network': 'Erreur réseau pour la reconnaissance vocale.',
          'speech_recognition_unavailable': 'Reconnaissance vocale non disponible dans ce navigateur.',
        }
        setMicError(errorMessages[error] ?? `Erreur micro : ${error}`)
        setMicState('idle')
        setInterimTranscript('')
      },
      () => {
        setInterimTranscript('')
        setMicState('processing')
        if (interim.trim()) {
          sendMessage(interim).then(() => setMicState('idle'))
        } else {
          setMicState('idle')
        }
      },
    )
  }

  function handleMicRelease() {
    if (micState === 'listening') {
      sttSessionRef.current?.stop()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-56px)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Link
          to="/games/$gameId"
          params={{ gameId }}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          &larr;
        </Link>
        <span className="text-2xl">{action.icon}</span>
        <h1 className="text-lg font-semibold text-slate-100">{action.label}</h1>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        {displayMessages.length === 0 && !isStreaming ? (
          <div className="flex-1 flex items-center justify-center h-full text-slate-500 text-sm px-8 text-center">
            Posez vos questions sur les règles, la stratégie, ou des situations de jeu.
          </div>
        ) : (
          <GameMasterPanel
            messages={displayMessages}
            streamingText={streamingText}
            isStreaming={isStreaming}
          />
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-800 px-4 py-3 flex flex-col gap-2">
        {micError && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
            {micError}
          </div>
        )}
        {interimTranscript && micState === 'listening' && (
          <div className="text-xs text-slate-400 italic px-1">
            🎙️ <span className="text-slate-300">{interimTranscript}</span>
          </div>
        )}
        <div className="flex items-end gap-3">
          {sttSupported() && (
            <MicButton
              state={micState}
              onPress={handleMicPress}
              onRelease={handleMicRelease}
              disabled={isStreaming}
            />
          )}

          <div className="flex-1 flex gap-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendText()
                }
              }}
              placeholder="Poser une question..."
              rows={1}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 resize-none text-sm transition-colors"
            />
            <button
              onClick={handleSendText}
              disabled={isStreaming || !textInput.trim()}
              className="shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl px-4 py-2.5 text-sm transition-colors"
            >
              &rarr;
            </button>
          </div>

          {ttsSupported() && (
            <button
              onClick={() => { setIsTTSOn((v) => !v); if (isTTSOn) stopTTS() }}
              className={`text-lg transition-opacity ${isTTSOn ? 'opacity-100' : 'opacity-30'}`}
              title={isTTSOn ? 'Couper la voix' : 'Activer la voix'}
            >
              🔊
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Param Input (generic)
// ──────────────────────────────────────────

function ParamInput({ param, value, onChange }: { param: ActionParam; value: unknown; onChange: (v: unknown) => void }) {
  if (param.type === 'number') {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">{param.label}</span>
        <input
          type="number"
          value={value as number ?? ''}
          min={param.min}
          max={param.max}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
        />
      </label>
    )
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">{param.label}</span>
      <input
        type="text"
        value={value as string ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-48 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
      />
    </label>
  )
}
