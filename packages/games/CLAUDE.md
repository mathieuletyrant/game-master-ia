# packages/games — Règles et prompts des jeux

Package TypeScript partagé entre `apps/web` et `apps/server`. Contient les règles, rôles, et system prompts de chaque jeu.

## Structure
```
src/
  index.ts                    # Export de GAMES[] et de chaque jeu
  loup-garou/
    rules.ts                  # Texte complet des règles (injecté dans le prompt)
    roles.ts                  # Définitions des rôles + distributeRoles()
    prompt.ts                 # buildSystemPrompt(state) → system prompt Claude
    index.ts                  # Re-exports du jeu
```

## Ajouter un jeu

1. Créer `src/<jeu>/rules.ts` — le texte des règles
2. Créer `src/<jeu>/roles.ts` — les rôles et leur distribution
3. Créer `src/<jeu>/prompt.ts` — `buildSystemPrompt(state)` qui retourne le system prompt complet
4. Créer `src/<jeu>/index.ts` — re-exports
5. Ajouter à `src/index.ts` :
   - Export du module jeu
   - Entrée dans le tableau `GAMES`
6. Mettre à jour `package.json` avec le nouvel export path

## Convention `gameState`
Chaque jeu définit son propre type `XxxState` (ex: `LoupGarouState`).
Le champ `GameSession.gameState` dans `apps/web/lib/db.ts` est `Record<string, unknown>` — le cast est de la responsabilité du jeu.

## API principale par jeu
```typescript
// Obligatoire
export function buildSystemPrompt(state: MyGameState): string

// Recommandé
export interface MyGameState { ... }
export const ROLES: Role[]
export function distributeRoles(playerCount: number): Role[]
```
