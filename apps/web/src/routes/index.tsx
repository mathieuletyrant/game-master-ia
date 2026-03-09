import { GAMES } from '@game-master/games'
import { GameCard } from '../components/GameCard'

export function HomePage() {
  return (
    <div className="flex-1 flex flex-col px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-100 mb-3">
          Choisissez votre jeu
        </h1>
        <p className="text-slate-400 text-lg">
          Votre assistant IA pour les jeux de société — règles, mise en place, questions.
        </p>
      </div>

      <div className="space-y-4">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <p className="text-center text-xs text-slate-600 mt-12">
        D'autres jeux arrivent bientôt...
      </p>
    </div>
  )
}
