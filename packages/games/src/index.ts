export * as loupGarou from './loup-garou/index.js'

export interface GameDefinition {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  durationMinutes: string
  tags: string[]
}

export const GAMES: GameDefinition[] = [
  {
    id: 'loup-garou',
    name: 'Loup-Garou de Thiercelieux',
    description:
      'Un jeu de déduction sociale où les villageois doivent identifier et éliminer les Loups-Garous cachés parmi eux.',
    minPlayers: 6,
    maxPlayers: 18,
    durationMinutes: '20-60',
    tags: ['déduction', 'social', 'bluff'],
  },
]
