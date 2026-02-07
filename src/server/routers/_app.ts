import { router } from '../trpc'
import { marketsRouter } from './markets'

export const appRouter = router({
  markets: marketsRouter,
})

export type AppRouter = typeof appRouter
