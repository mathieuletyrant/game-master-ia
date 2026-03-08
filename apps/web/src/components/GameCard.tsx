import { Link } from '@tanstack/react-router'
import type { GameDefinition } from '@game-master/games'

interface Props {
  game: GameDefinition
}

export function GameCard({ game }: Props) {
  return (
    <Link
      to="/games/$gameId/setup"
      params={{ gameId: game.id }}
      className="group block rounded-2xl border border-slate-700 bg-slate-900 hover:border-amber-500/60 hover:bg-slate-800 transition-all duration-200 p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
          {game.name}
        </h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
          {game.minPlayers}–{game.maxPlayers} joueurs
        </span>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed mb-4">
        {game.description}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {game.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs text-violet-300 bg-violet-900/30 border border-violet-700/40 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-500">{game.durationMinutes} min</span>
      </div>
    </Link>
  )
}
