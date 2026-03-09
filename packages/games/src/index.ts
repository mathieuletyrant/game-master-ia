export * as loupGarou from './loup-garou/index.js'

export interface ActionParam {
  id: string
  label: string
  type: 'number' | 'text'
  required: boolean
  default?: number | string
  min?: number
  max?: number
}

export interface GameAction {
  id: string
  label: string
  description: string
  icon: string
  mode: 'one-shot' | 'qa'
  params?: ActionParam[]
  buildPrompt: (params?: Record<string, unknown>) => string
}

export interface GameDefinition {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  tags: string[]
  actions: GameAction[]
}

import { actions as loupGarouActions } from './loup-garou/index.js'

export const GAMES: GameDefinition[] = [
  {
    id: 'loup-garou',
    name: 'Loup-Garou de Thiercelieux',
    description:
      'Un jeu de déduction sociale où les villageois doivent identifier et éliminer les Loups-Garous cachés parmi eux.',
    minPlayers: 6,
    maxPlayers: 18,
    tags: ['déduction', 'social', 'bluff'],
    actions: loupGarouActions,
  },
]
