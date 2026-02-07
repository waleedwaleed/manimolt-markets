import { router, publicProcedure } from '../trpc'

export const usersRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    // For demo, get or create a demo user
    let user = await ctx.prisma.user.findFirst()
    if (!user) {
      user = await ctx.prisma.user.create({
        data: { name: 'Demo User', balance: 1000 }
      })
    }
    return user
  }),

  leaderboard: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      orderBy: { balance: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        balance: true,
        _count: { select: { bets: true } }
      }
    })
  }),
})
