interface Props {
  state: 'idle' | 'listening' | 'processing'
  onPress: () => void
  onRelease: () => void
  disabled?: boolean
}

const labels = {
  idle: 'Maintenir pour parler',
  listening: 'Relâcher pour envoyer',
  processing: 'Traitement...',
}

export function MicButton({ state, onPress, onRelease, disabled }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        disabled={disabled || state === 'processing'}
        onPointerDown={onPress}
        onPointerUp={onRelease}
        onPointerLeave={onRelease}
        className={[
          'w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-150 select-none touch-none',
          state === 'listening'
            ? 'bg-red-600 border-red-400 scale-110 animate-pulse-glow'
            : state === 'processing'
              ? 'bg-slate-700 border-slate-600 opacity-60 cursor-not-allowed'
              : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-amber-500/60 active:scale-95',
        ].join(' ')}
        aria-label={labels[state]}
      >
        {state === 'listening' ? '🎙️' : state === 'processing' ? '⏳' : '🎤'}
      </button>
      <span className="text-xs text-slate-500">{labels[state]}</span>
    </div>
  )
}
