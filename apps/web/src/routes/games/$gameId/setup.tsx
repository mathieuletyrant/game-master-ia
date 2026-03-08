import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { distributeRoles, ROLES } from '@game-master/games/loup-garou'
import { sessions, generateId } from '../../../lib/db'
import { createInitialState } from '../../../lib/game-state'
import { GAMES } from '@game-master/games'

export function SetupPage() {
  const { gameId } = useParams({ from: '/games/$gameId/setup' })
  const navigate = useNavigate()

  const game = GAMES.find((g) => g.id === gameId)

  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(6).fill('').map((_, i) => `Joueur ${i + 1}`),
  )
  const [playerCount, setPlayerCount] = useState(6)
  const [error, setError] = useState('')

  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Jeu introuvable.
      </div>
    )
  }

  const names = playerNames.slice(0, playerCount)

  function updateName(index: number, value: string) {
    setPlayerNames((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function addPlayer() {
    if (playerCount < game!.maxPlayers) {
      setPlayerCount((c) => c + 1)
      setPlayerNames((prev) => [...prev, `Joueur ${prev.length + 1}`])
    }
  }

  function removePlayer() {
    if (playerCount > game!.minPlayers) {
      setPlayerCount((c) => c - 1)
    }
  }

  function startGame() {
    const trimmed = names.map((n) => n.trim())
    const duplicates = trimmed.filter((n, i) => trimmed.indexOf(n) !== i)
    if (trimmed.some((n) => !n)) {
      setError('Tous les joueurs doivent avoir un nom.')
      return
    }
    if (duplicates.length > 0) {
      setError(`Noms en double : ${duplicates.join(', ')}`)
      return
    }

    const roles = distributeRoles(playerCount)
    const shuffled = [...roles].sort(() => Math.random() - 0.5)
    const players = trimmed.map((name, i) => ({
      name,
      roleId: shuffled[i]?.id ?? 'simple-villageois',
      alive: true,
    }))

    const sessionId = generateId()
    const gameState = createInitialState(players)

    sessions.upsert({
      id: sessionId,
      gameId: game!.id,
      gameName: game!.name,
      players: trimmed,
      status: 'playing',
      gameState: gameState as unknown as Record<string, unknown>,
      startedAt: new Date().toISOString(),
    })

    // Store players with roles in sessionStorage (roles are secret, not in the DB)
    sessionStorage.setItem(
      `session:${sessionId}:players`,
      JSON.stringify(players),
    )

    navigate({ to: '/games/$gameId/play', params: { gameId }, search: { sessionId } })
  }

  const rolePreview = distributeRoles(playerCount)
  const roleCounts: Record<string, number> = {}
  for (const role of rolePreview) {
    roleCounts[role.id] = (roleCounts[role.id] ?? 0) + 1
  }

  return (
    <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">{game.name}</h1>
      <p className="text-slate-400 text-sm mb-8">Configuration de la partie</p>

      {/* Player count */}
      <div className="mb-6">
        <label className="text-sm font-medium text-slate-300 block mb-3">
          Nombre de joueurs
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={removePlayer}
            disabled={playerCount <= game.minPlayers}
            className="w-10 h-10 rounded-full border border-slate-600 text-xl text-slate-300 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            −
          </button>
          <span className="text-3xl font-bold text-amber-400 w-8 text-center">
            {playerCount}
          </span>
          <button
            onClick={addPlayer}
            disabled={playerCount >= game.maxPlayers}
            className="w-10 h-10 rounded-full border border-slate-600 text-xl text-slate-300 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Role preview */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
          Composition
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(roleCounts).map(([roleId, count]) => {
            const role = ROLES.find((r) => r.id === roleId)
            return (
              <span
                key={roleId}
                className={[
                  'text-xs px-2 py-1 rounded-full border',
                  role?.team === 'loups'
                    ? 'bg-red-900/30 border-red-700/40 text-red-300'
                    : role?.team === 'neutre'
                      ? 'bg-violet-900/30 border-violet-700/40 text-violet-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300',
                ].join(' ')}
              >
                {count}× {role?.name ?? roleId}
              </span>
            )
          })}
        </div>
      </div>

      {/* Player names */}
      <div className="mb-6 space-y-2">
        <label className="text-sm font-medium text-slate-300 block mb-3">
          Noms des joueurs
        </label>
        {names.map((name, i) => (
          <input
            key={i}
            value={name}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder={`Joueur ${i + 1}`}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors text-sm"
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      )}

      <button
        onClick={startGame}
        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl py-4 text-lg transition-colors"
      >
        Lancer la partie →
      </button>
    </div>
  )
}
