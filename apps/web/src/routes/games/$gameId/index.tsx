import { useParams, Link } from '@tanstack/react-router'
import { GAMES } from '@game-master/games'

export function GameActionsPage() {
  const { gameId } = useParams({ from: '/games/$gameId' })
  const game = GAMES.find((g) => g.id === gameId)

  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Jeu introuvable. <a href="/" className="ml-2 text-amber-400">Retour</a>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          &larr; Tous les jeux
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">{game.name}</h1>
        <p className="text-slate-400">{game.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {game.actions.map((action) => (
          <Link
            key={action.id}
            to="/games/$gameId/action/$actionId"
            params={{ gameId: game.id, actionId: action.id }}
            className="group block rounded-2xl border border-slate-700 bg-slate-900 hover:border-amber-500/60 hover:bg-slate-800 transition-all duration-200 p-5 cursor-pointer"
          >
            <div className="text-3xl mb-3">{action.icon}</div>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-amber-300 transition-colors mb-1">
              {action.label}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
