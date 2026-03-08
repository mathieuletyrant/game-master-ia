import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { RootLayout } from './components/RootLayout'
import { HomePage } from './routes/index'
import { SetupPage } from './routes/games/$gameId/setup'
import { PlayPage } from './routes/games/$gameId/play'
import { HistoryPage } from './routes/history'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <RootLayout>
        <Outlet />
      </RootLayout>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/$gameId/setup',
  component: SetupPage,
})

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/$gameId/play',
  validateSearch: (search: Record<string, unknown>) => ({
    sessionId: typeof search.sessionId === 'string' ? search.sessionId : '',
  }),
  component: PlayPage,
})

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  setupRoute,
  playRoute,
  historyRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
