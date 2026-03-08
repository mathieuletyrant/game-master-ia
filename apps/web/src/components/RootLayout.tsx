import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-amber-400 font-bold text-lg tracking-wide">
          <span className="text-2xl">🎲</span>
          Game Master IA
        </Link>
        <Link
          to="/history"
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Historique
        </Link>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
