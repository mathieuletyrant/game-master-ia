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
  games/$gameId/
    index.tsx                   # Page des actions disponibles pour un jeu
    action/$actionId.tsx        # Exécution d'une action (one-shot ou Q&A)

components/
  RootLayout.tsx                # Layout global (header)
  GameCard.tsx                  # Carte cliquable d'un jeu
  GameMasterPanel.tsx           # Affichage du chat IA avec streaming
  MicButton.tsx                 # Bouton push-to-talk STT

lib/
  api.ts                        # Client fetch → apps/server (streaming)
  tts.ts                        # Web Speech API TTS (speak/stop)
  stt.ts                        # Web Speech API STT (startListening)
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
- **Pas de persistance** : pas de sessions, pas de localStorage. L'historique Q&A est en React state uniquement.
- Le frontend est 100% générique — aucun code spécifique à un jeu. Tout est piloté par `GAMES` et `GameAction`.

## Ajouter une route
1. Créer le composant dans `src/routes/`
2. Créer la route dans `src/router.tsx` et l'ajouter à `routeTree`
