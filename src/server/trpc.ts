import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { Context } from './context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user || !(ctx.session.user as any).id) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' })
  }
  return next({
    ctx: {
      ...ctx,
      userId: (ctx.session.user as any).id as string,
    },
  })
})
