import { Link } from '@tanstack/react-router'
import { sessions } from '../lib/db'

export function HistoryPage() {
  const allSessions = sessions.getAll()

  return (
    <div className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Historique</h1>
        <Link to="/" className="text-sm text-amber-400 hover:text-amber-300">
          ← Accueil
        </Link>
      </div>

      {allSessions.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-5xl mb-4">🎲</p>
          <p>Aucune partie jouée pour l'instant.</p>
          <Link to="/" className="mt-4 inline-block text-amber-400 hover:text-amber-300 text-sm">
            Lancer une partie →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allSessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl border border-slate-700 bg-slate-900 p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-200">{session.gameName}</span>
                <span className={[
                  'text-xs px-2 py-0.5 rounded-full',
                  session.status === 'finished'
                    ? 'bg-green-900/40 text-green-400 border border-green-700/40'
                    : session.status === 'playing'
                      ? 'bg-amber-900/30 text-amber-400 border border-amber-700/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700',
                ].join(' ')}>
                  {session.status === 'finished' ? 'Terminée' : session.status === 'playing' ? 'En cours' : 'Setup'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-2">
                {session.players.join(', ')}
              </p>
              <p className="text-xs text-slate-600">
                {new Date(session.startedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
