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
  tts.ts              # ElevenLabs TTS (optionnel)
```

## Variables d'environnement
```
ANTHROPIC_API_KEY=sk-ant-...    # OBLIGATOIRE — clé Anthropic
PORT=3001                        # Port du serveur (défaut: 3001)
WEB_ORIGIN=http://localhost:5173 # Origine autorisée pour CORS
ELEVENLABS_API_KEY=...           # Optionnel — TTS ElevenLabs
```

## Endpoints
| Méthode | Path | Description |
|---|---|---|
| GET | /health | Health check |
| POST | /ai/chat | Stream la réponse Claude (text/plain chunked) |
| POST | /ai/tts | Synthèse vocale ElevenLabs (optionnel) |

## Format POST /ai/chat
```typescript
// Body
{
  gameId: string                    // ex: 'loup-garou'
  actionId: string                  // ex: 'setup', 'qa'
  params?: Record<string, unknown>  // ex: { playerCount: 8 }
  messages: Array<{ role: 'user' | 'assistant', content: string }>
}

// Response: text/plain, streamed chunk by chunk
```

## Architecture
Le serveur est **100% générique** — aucun code spécifique à un jeu. Il lookup le jeu + action dans `GAMES` (depuis `@game-master/games`), appelle `action.buildPrompt(params)` pour le system prompt, et stream via Claude.

## Modèle Claude
- **claude-haiku-4-5** — streaming activé, max_tokens 1024
- Le system prompt est construit par l'action du jeu à chaque requête
