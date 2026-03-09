import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { RootLayout } from './components/RootLayout'
import { HomePage } from './routes/index'
import { GameActionsPage } from './routes/games/$gameId/index'
import { ActionPage } from './routes/games/$gameId/action/$actionId'

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

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/$gameId',
  component: GameActionsPage,
})

const actionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/$gameId/action/$actionId',
  component: ActionPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  gameRoute,
  actionRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
