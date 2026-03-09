# packages/games — Règles et actions des jeux

Package TypeScript partagé entre `apps/web` et `apps/server`. Contient les règles, rôles, et actions de chaque jeu.

## Structure
```
src/
  index.ts                    # Types (GameAction, ActionParam, GameDefinition) + GAMES[]
  loup-garou/
    rules.ts                  # Texte complet des règles
    roles.ts                  # Définitions des rôles + distributeRoles()
    actions.ts                # Actions du jeu (setup, end-conditions, roles, qa)
    index.ts                  # Re-exports du jeu
```

## Types principaux

```typescript
interface GameAction {
  id: string
  label: string
  description: string
  icon: string
  mode: 'one-shot' | 'qa'
  params?: ActionParam[]
  buildPrompt: (params?: Record<string, unknown>) => string
}

interface ActionParam {
  id: string
  label: string
  type: 'number' | 'text'
  required: boolean
  default?: number | string
  min?: number
  max?: number
}
```

## Ajouter un jeu

1. Créer `src/<jeu>/rules.ts` — le texte des règles
2. Créer `src/<jeu>/roles.ts` — les rôles et leur distribution
3. Créer `src/<jeu>/actions.ts` — les actions (`GameAction[]`)
4. Créer `src/<jeu>/index.ts` — re-exports
5. Ajouter à `src/index.ts` : import des actions + entrée dans `GAMES`
6. Mettre à jour `package.json` avec le nouvel export path

## Convention actions
- **`one-shot`** : réponse unique. `buildPrompt(params)` génère le system prompt complet.
- **`qa`** : mode conversationnel. `buildPrompt()` génère le system prompt. Les messages user/assistant sont envoyés au fil de la conversation.

## Contrainte
Tout le code spécifique à un jeu doit rester dans ce package. Les apps `web` et `server` n'importent que les types et le registre `GAMES`.
