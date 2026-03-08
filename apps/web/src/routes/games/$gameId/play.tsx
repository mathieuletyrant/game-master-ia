import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearch } from '@tanstack/react-router'
import { GameMasterPanel } from '../../../components/GameMasterPanel'
import { MicButton } from '../../../components/MicButton'
import { streamAIResponse, type ChatMessage } from '../../../lib/api'
import { speak, stop as stopTTS, isSupported as ttsSupported, unlockTTS } from '../../../lib/tts'
import { startListening, isSupported as sttSupported } from '../../../lib/stt'
import { sessions, messages as messagesDb, generateId } from '../../../lib/db'
import { createInitialState, advanceToNight, advanceToDay, eliminatePlayer } from '../../../lib/game-state'
import type { LoupGarouState } from '@game-master/games/loup-garou'
import type { Player } from '../../../lib/game-state'
import { GAMES } from '@game-master/games'

interface DisplayMessage {
  id: string
  role: 'ai' | 'user'
  content: string
}

export function PlayPage() {
  const { gameId } = useParams({ from: '/games/$gameId/play' })
  const search = useSearch({ from: '/games/$gameId/play' }) as { sessionId?: string }
  const sessionId = search.sessionId ?? ''

  const game = GAMES.find((g) => g.id === gameId)
  const session = sessions.getById(sessionId)

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`session:${sessionId}:players`) ?? '[]')
    } catch {
      return []
    }
  })

  const [gameState, setGameState] = useState<LoupGarouState>(() => {
    if (session?.gameState) return session.gameState as LoupGarouState
    return createInitialState(players)
  })

  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>(() =>
    messagesDb.getBySession(sessionId).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
  )

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [micState, setMicState] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [isTTSOn, setIsTTSOn] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [micError, setMicError] = useState('')

  const sttSessionRef = useRef<{ stop(): void } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const introSentRef = useRef(false)
  const ttsUnlockedRef = useRef(false)

  const addAIMessage = useCallback((content: string) => {
    const id = generateId()
    const msg: DisplayMessage = { id, role: 'ai', content }
    setDisplayMessages((prev) => [...prev, msg])
    messagesDb.add({ id, sessionId, role: 'ai', content, timestamp: new Date().toISOString() })
    setChatHistory((prev) => [...prev, { role: 'assistant', content }])
    if (isTTSOn && ttsSupported()) speak(content)
    return content
  }, [sessionId, isTTSOn])

  const sendMessage = useCallback(async (userText: string, currentGameState = gameState) => {
    if (!userText.trim() || isStreaming) return

    const userMsgId = generateId()
    const userMsg: DisplayMessage = { id: userMsgId, role: 'user', content: userText }
    setDisplayMessages((prev) => [...prev, userMsg])
    messagesDb.add({ id: userMsgId, sessionId, role: 'user', content: userText, timestamp: new Date().toISOString() })

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userText }]
    setChatHistory(newHistory)

    setIsStreaming(true)
    setStreamingText('')
    stopTTS()

    abortRef.current = new AbortController()
    let fullText = ''

    try {
      fullText = await streamAIResponse(
        newHistory,
        currentGameState,
        gameId,
        (chunk) => setStreamingText((prev) => prev + chunk),
        abortRef.current.signal,
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        fullText = "Désolé, je n'arrive pas à contacter le serveur. Vérifiez votre connexion."
      }
    }

    setStreamingText('')
    setIsStreaming(false)

    if (fullText) {
      addAIMessage(fullText)
    }
  }, [gameId, sessionId, chatHistory, gameState, isStreaming, addAIMessage])

  // Unlock TTS on first user interaction (Chrome autoplay policy)
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

  // Auto-start: greet the players on mount (guard against React StrictMode double-fire)
  useEffect(() => {
    if (introSentRef.current) return
    if (displayMessages.length === 0 && players.length > 0) {
      introSentRef.current = true
      const intro = `Votre serviteur. Cette nuit, ${players.length} âmes vont affronter les ténèbres dans le village de Thiercelieux. Les cartes sont distribuées — que chacun garde son rôle secret. Que la partie commence !`
      sendMessage(intro, gameState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist game state
  useEffect(() => {
    if (!sessionId) return
    sessions.upsert({
      ...(session ?? {
        id: sessionId,
        gameId,
        gameName: game?.name ?? gameId,
        players: players.map((p) => p.name),
        startedAt: new Date().toISOString(),
      }),
      status: gameState.phase === 'finished' ? 'finished' : 'playing',
      gameState: gameState as unknown as Record<string, unknown>,
    })
  }, [gameState, sessionId, gameId, game, players, session])

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

  // Phase control helpers
  function handleNight() {
    const next = advanceToNight(gameState)
    setGameState(next)
    sendMessage('La nuit tombe sur le village...', next)
  }

  function handleDay(eliminated: string[] = []) {
    const next = advanceToDay(gameState, eliminated)
    setGameState(next)
    const deathText = eliminated.length > 0
      ? `Le soleil se lève... et révèle un drame. ${eliminated.join(' et ')} a été trouvé mort.`
      : 'Le soleil se lève sur un village épargné cette nuit.'
    sendMessage(deathText, next)
  }

  if (!session && players.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Session introuvable. <a href="/" className="ml-2 text-amber-400">Retour</a>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-56px)]">
      {/* Game master chat */}
      <div className="flex-1 overflow-hidden">
        <GameMasterPanel
          messages={displayMessages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          phase={gameState.phase}
        />
      </div>

      {/* Phase controls */}
      {gameState.phase !== 'finished' && (
        <div className="px-4 py-2 flex gap-2 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={handleNight}
            disabled={isStreaming}
            className="text-xs shrink-0 px-3 py-1.5 rounded-lg border border-violet-700/50 text-violet-300 hover:bg-violet-900/30 disabled:opacity-40 transition-colors"
          >
            🌙 Lancer la nuit
          </button>
          <button
            onClick={() => handleDay([])}
            disabled={isStreaming}
            className="text-xs shrink-0 px-3 py-1.5 rounded-lg border border-amber-700/50 text-amber-300 hover:bg-amber-900/20 disabled:opacity-40 transition-colors"
          >
            ☀️ Lancer le jour (0 mort)
          </button>
          <button
            onClick={() => {
              const name = prompt('Nom du joueur éliminé cette nuit ?')
              if (name) handleDay([name])
            }}
            disabled={isStreaming}
            className="text-xs shrink-0 px-3 py-1.5 rounded-lg border border-red-700/50 text-red-300 hover:bg-red-900/20 disabled:opacity-40 transition-colors"
          >
            💀 Jour avec mort
          </button>
        </div>
      )}

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
            placeholder="Poser une question au Maître de Jeu..."
            rows={1}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 resize-none text-sm transition-colors"
          />
          <button
            onClick={handleSendText}
            disabled={isStreaming || !textInput.trim()}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl px-4 py-2.5 text-sm transition-colors"
          >
            →
          </button>
        </div>

        <button
          onClick={() => { setIsTTSOn((v) => !v); if (isTTSOn) stopTTS() }}
          className={`text-lg transition-opacity ${isTTSOn ? 'opacity-100' : 'opacity-30'}`}
          title={isTTSOn ? 'Couper la voix' : 'Activer la voix'}
        >
          🔊
        </button>
      </div>
      </div>
    </div>
  )
}
