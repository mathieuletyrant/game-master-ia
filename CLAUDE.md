# Game Master IA — CLAUDE.md

## Vue d'ensemble
Monorepo pour une PWA "Maître de Jeu IA" pour les jeux de société. Le MJ IA guide les joueurs via narration vocale (TTS) et répond aux questions en open mic (STT), alimenté par Claude.

## Structure du monorepo
```
apps/web/      → Frontend PWA (Vite + React + TanStack Router)
apps/server/   → Backend API (Hono + Anthropic SDK)
packages/games → Règles et prompts des jeux (partagé)
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
- Les règles et prompts des jeux vivent dans `packages/games`, pas dans les apps
- `apps/web` communique avec `apps/server` via `VITE_SERVER_URL` (fetch HTTP)
- Chaque jeu dans `packages/games` définit son propre `gameState` typé

## Tech stack
| | Techno |
|---|---|
| Frontend | Vite + React 19 + TanStack Router + TanStack Query |
| Backend | Hono + @hono/node-server |
| IA | @anthropic-ai/sdk, modèle claude-sonnet-4-6 |
| TTS/STT | Web Speech API (natif browser, FR) |
| DB locale | localStorage wrapper (compatible TanStack DB API) |
| Styles | Tailwind CSS v4 + shadcn/ui |
| PWA | vite-plugin-pwa |
| Monorepo | pnpm workspaces + Turborepo |

## Jeux supportés (MVP)
- **Loup-Garou de Thiercelieux** (`packages/games/src/loup-garou/`)
  - Règles : `rules.ts`
  - Rôles : `roles.ts` (avec distribution automatique selon le nombre de joueurs)
  - Prompt : `prompt.ts` (system prompt Claude avec injection de l'état du jeu)

## Ajouter un nouveau jeu
1. Créer `packages/games/src/<jeu>/` avec `rules.ts`, `roles.ts`, `prompt.ts`, `index.ts`
2. Exporter depuis `packages/games/src/index.ts`
3. Ajouter à `GAMES` dans `packages/games/src/index.ts`
4. Ajouter le handler dans `apps/server/src/routes/ai.ts` (`if (gameId !== ...)`)
