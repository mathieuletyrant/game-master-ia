import type { LoupGarouState } from '@game-master/games/loup-garou'

export interface Player {
  name: string
  roleId: string
  alive: boolean
  roleRevealed?: string
}

export interface SessionSetup {
  gameId: string
  players: Player[]
}

export function createInitialState(players: Player[]): LoupGarouState {
  return {
    phase: 'setup',
    round: 0,
    players: players.map((p) => ({ name: p.name, alive: true })),
    eliminatedThisPhase: [],
  }
}

export function advanceToNight(state: LoupGarouState): LoupGarouState {
  return {
    ...state,
    phase: 'night',
    round: state.round + 1,
    eliminatedThisPhase: [],
  }
}

export function advanceToDay(
  state: LoupGarouState,
  eliminated: string[],
): LoupGarouState {
  const updatedPlayers = state.players.map((p) =>
    eliminated.includes(p.name) ? { ...p, alive: false } : p,
  )
  return {
    ...state,
    phase: 'day',
    players: updatedPlayers,
    eliminatedThisPhase: eliminated,
  }
}

export function eliminatePlayer(
  state: LoupGarouState,
  playerName: string,
  revealedRole?: string,
): LoupGarouState {
  const updatedPlayers = state.players.map((p) =>
    p.name === playerName
      ? { ...p, alive: false, roleRevealed: revealedRole }
      : p,
  )
  return {
    ...state,
    players: updatedPlayers,
    eliminatedThisPhase: [...state.eliminatedThisPhase, playerName],
  }
}

export function checkWinCondition(
  state: LoupGarouState,
): 'village' | 'loups' | null {
  const alive = state.players.filter((p) => p.alive)
  // Note: we don't have role info in the generic state — the host determines this
  // This is a simplified check; in a real game the server would know roles
  return null
}

export function finishGame(
  state: LoupGarouState,
  winner: 'village' | 'loups' | 'amoureux',
): LoupGarouState {
  return { ...state, phase: 'finished', winner }
}
