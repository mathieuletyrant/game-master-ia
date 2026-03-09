# Game Master IA — CLAUDE.md

## Vue d'ensemble
Monorepo pour une PWA "Assistant Jeux de Société IA". L'app propose des actions prédéfinies par jeu (mise en place, fin de partie, rôles, etc.) et un mode Q&A pour poser des questions sur les règles via chat ou micro, alimenté par Claude.

## Structure du monorepo
```
apps/web/      → Frontend PWA (Vite + React + TanStack Router)
apps/server/   → Backend API (Hono + Anthropic SDK)
packages/games → Règles, rôles et actions des jeux (partagé)
```

## Commandes clés
```bash
pnpm install           # Installer toutes les dépendances (depuis la racine)
pnpm dev               # Lancer tous les services en parallèle (turbo)
pnpm build             # Build de production
pnpm type-check        # Vérification TypeScript de tout le monorepo
```

## Démarrage rapide
1. `cp apps/server/.env.example apps/server/.env` puis ajouter `ANTHROPIC_API_KEY`
2. `cp apps/web/.env.example apps/web/.env` (optionnel, valeurs par défaut ok en dev)
3. `pnpm install`
4. `pnpm dev`
   - Web : http://localhost:5173
   - Server : http://localhost:3001

## Règles d'architecture importantes
- **La clé `ANTHROPIC_API_KEY` ne doit jamais être dans `apps/web`** — côté serveur uniquement
- **Aucun code spécifique à un jeu ne doit exister en dehors de `packages/games`** — les apps `web` et `server` sont 100% génériques
- Les règles, rôles, prompts et actions des jeux vivent dans `packages/games`
- `apps/web` communique avec `apps/server` via `VITE_SERVER_URL` (fetch HTTP)
- Chaque jeu dans `packages/games` définit ses propres `GameAction[]` avec des prompts dédiés

## Architecture des actions
Chaque jeu définit un tableau d'actions (`GameAction[]`) dans `packages/games` :
- **`one-shot`** : action ponctuelle (ex: "mise en place", "fin de partie"). Peut avoir des paramètres (ex: nombre de joueurs). L'IA génère une réponse unique.
- **`qa`** : mode conversationnel. L'utilisateur pose des questions sur les règles via chat ou micro.

Le serveur est 100% générique : il lookup le jeu + action dans `GAMES`, appelle `action.buildPrompt(params)`, et stream la réponse Claude. Aucun `if (gameId === ...)`.

## Tech stack
| | Techno |
|---|---|
| Frontend | Vite + React 19 + TanStack Router + TanStack Query |
| Backend | Hono + @hono/node-server |
| IA | @anthropic-ai/sdk, modèle claude-haiku-4-5 |
| TTS/STT | Web Speech API (natif browser, FR) |
| Styles | Tailwind CSS v4 + shadcn/ui |
| PWA | vite-plugin-pwa |
| Monorepo | pnpm workspaces + Turborepo |

## Jeux supportés (MVP)
- **Loup-Garou de Thiercelieux** (`packages/games/src/loup-garou/`)
  - Règles : `rules.ts`
  - Rôles : `roles.ts` (avec distribution automatique selon le nombre de joueurs)
  - Actions : `actions.ts` (mise en place, fin de partie, rôles, Q&A)

## Ajouter un nouveau jeu
1. Créer `packages/games/src/<jeu>/` avec `rules.ts`, `roles.ts`, `actions.ts`, `index.ts`
2. Exporter `actions` depuis `index.ts`
3. Ajouter à `GAMES` dans `packages/games/src/index.ts` avec `actions`
4. C'est tout — le serveur et le frontend sont génériques, pas de code à modifier dans les apps
