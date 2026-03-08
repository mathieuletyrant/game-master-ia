# apps/server — Backend Hono

## Commandes
```bash
pnpm dev          # Dev avec hot-reload (Node --watch) sur http://localhost:3001
pnpm build        # Compile TypeScript → dist/
pnpm start        # Lance le build de production
pnpm type-check   # Vérification TypeScript
```

## Structure src/
```
index.ts              # Entry point Hono — CORS, routes
routes/
  ai.ts               # POST /ai/chat → stream Claude
lib/
  claude.ts           # Wrapper Anthropic SDK (streamGameMaster)
```

## Variables d'environnement
```
ANTHROPIC_API_KEY=sk-ant-...    # OBLIGATOIRE — clé Anthropic
PORT=3001                        # Port du serveur (défaut: 3001)
WEB_ORIGIN=http://localhost:5173 # Origine autorisée pour CORS
```

## Endpoints
| Méthode | Path | Description |
|---|---|---|
| GET | /health | Health check |
| POST | /ai/chat | Stream la réponse Claude (text/plain chunked) |

## Format POST /ai/chat
```typescript
// Body
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>
  gameState: LoupGarouState  // état actuel du jeu
  gameId: 'loup-garou'       // identifiant du jeu
}

// Response: text/plain, streamed chunk by chunk
```

## Ajouter un jeu
Dans `routes/ai.ts`, ajouter un `else if (gameId === 'mon-jeu')` et importer le `buildSystemPrompt` correspondant depuis `@game-master/games`.

## Modèle Claude
- **claude-sonnet-4-6** — streaming activé, max_tokens 400
- Le system prompt est reconstruit à chaque requête avec l'état courant du jeu
