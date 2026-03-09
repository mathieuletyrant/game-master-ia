import { useEffect, useRef } from 'react'

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
}

interface Props {
  messages: Message[]
  streamingText: string
  isStreaming: boolean
}

export function GameMasterPanel({ messages, streamingText, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.role === 'ai' ? 'flex gap-3' : 'flex gap-3 flex-row-reverse'}
          >
            <div className="text-xl shrink-0 mt-1">
              {msg.role === 'ai' ? '🧙' : '💬'}
            </div>
            <div className={[
              'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'ai'
                ? 'bg-slate-800 border border-slate-700 text-slate-100'
                : 'bg-amber-900/30 border border-amber-700/30 text-amber-100 ml-auto',
            ].join(' ')}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {isStreaming && (
          <div className="flex gap-3">
            <div className="text-xl shrink-0 mt-1">🧙</div>
            <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-slate-800 border border-violet-700/40 text-slate-100">
              {streamingText}
              <span className="inline-block w-0.5 h-4 bg-violet-400 ml-1 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
