import { router } from '../trpc'
import { marketsRouter } from './markets'
import { usersRouter } from './users'

export const appRouter = router({
  markets: marketsRouter,
  users: usersRouter,
})

export type AppRouter = typeof appRouter
