# apps/web — Frontend PWA

## Commandes
```bash
pnpm dev          # Dev server sur http://localhost:5173
pnpm build        # Build de production
pnpm type-check   # Vérification TypeScript
```

## Structure src/
```
routes/                         # Pages (TanStack Router)
  index.tsx                     # Accueil — liste des jeux
  history.tsx                   # Historique des sessions
  games/$gameId/
    setup.tsx                   # Config joueurs + distribution des rôles
    play.tsx                    # Écran principal de jeu (MJ IA)

components/
  RootLayout.tsx                # Layout global (header nav)
  GameCard.tsx                  # Carte cliquable d'un jeu
  GameMasterPanel.tsx           # Affichage du chat IA avec streaming
  MicButton.tsx                 # Bouton push-to-talk STT

lib/
  api.ts                        # Client fetch → apps/server (streaming)
  tts.ts                        # Web Speech API TTS (speak/stop)
  stt.ts                        # Web Speech API STT (startListening)
  db.ts                         # localStorage comme store local-first
  game-state.ts                 # Fonctions de mutation de l'état du jeu
  query.ts                      # TanStack Query client
```

## Variables d'environnement
```
VITE_SERVER_URL=http://localhost:3001   # URL du backend apps/server
```

## Points d'attention
- **TTS** : `speak()` dans `lib/tts.ts` — préférer une voix française si dispo dans le browser
- **STT** : `startListening()` dans `lib/stt.ts` — pousse les résultats au fur et à mesure
- **Streaming** : `streamAIResponse()` dans `lib/api.ts` — consume un ReadableStream et appelle `onChunk` pour chaque token
- **DB** : `lib/db.ts` expose `sessions` et `messages` avec une API CRUD simple sur localStorage
- La route `/games/$gameId/play?sessionId=...` attend `sessionId` en search param — voir `router.tsx`
- Les rôles des joueurs sont dans `sessionStorage` (secret, pas persisté dans localStorage)

## Ajouter une route
1. Créer le composant dans `src/routes/`
2. Créer la route dans `src/router.tsx` et l'ajouter à `routeTree`
