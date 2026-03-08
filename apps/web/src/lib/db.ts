// TanStack DB is very new (beta). We use localStorage as a simple local-first
// store that mirrors the TanStack DB API shape, ready to be swapped when
// TanStack DB stabilises.

export interface StoredSession {
  id: string
  gameId: string
  gameName: string
  players: string[]
  status: 'setup' | 'playing' | 'finished'
  gameState: Record<string, unknown>
  startedAt: string
  endedAt?: string
}

export interface StoredMessage {
  id: string
  sessionId: string
  role: 'ai' | 'user'
  content: string
  timestamp: string
}

const SESSIONS_KEY = 'gm:sessions'
const MESSAGES_KEY = 'gm:messages'

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// Sessions
export const sessions = {
  getAll(): StoredSession[] {
    return load<StoredSession>(SESSIONS_KEY)
  },
  getById(id: string): StoredSession | undefined {
    return this.getAll().find((s) => s.id === id)
  },
  upsert(session: StoredSession): void {
    const all = this.getAll()
    const idx = all.findIndex((s) => s.id === session.id)
    if (idx >= 0) all[idx] = session
    else all.unshift(session)
    save(SESSIONS_KEY, all)
  },
  delete(id: string): void {
    save(SESSIONS_KEY, this.getAll().filter((s) => s.id !== id))
  },
}

// Messages
export const messages = {
  getBySession(sessionId: string): StoredMessage[] {
    return load<StoredMessage>(MESSAGES_KEY).filter(
      (m) => m.sessionId === sessionId,
    )
  },
  add(message: StoredMessage): void {
    const all = load<StoredMessage>(MESSAGES_KEY)
    all.push(message)
    save(MESSAGES_KEY, all)
  },
  deleteBySession(sessionId: string): void {
    const all = load<StoredMessage>(MESSAGES_KEY).filter(
      (m) => m.sessionId !== sessionId,
    )
    save(MESSAGES_KEY, all)
  },
}

export function generateId(): string {
  return crypto.randomUUID()
}
