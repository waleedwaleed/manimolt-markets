import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

// Simple constant-product AMM
function calculateShares(yesShares: number, noShares: number, outcome: 'YES' | 'NO', amount: number) {
  const k = yesShares * noShares // invariant
  
  if (outcome === 'YES') {
    // Buying YES = adding to NO pool, taking from YES pool
    const newNoShares = noShares + amount
    const newYesShares = k / newNoShares
    return yesShares - newYesShares
  } else {
    // Buying NO = adding to YES pool, taking from NO pool
    const newYesShares = yesShares + amount
    const newNoShares = k / newYesShares
    return noShares - newNoShares
  }
}

export const marketsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.market.findMany({
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { name: true } } }
    })
  }),

  create: publicProcedure
    .input(z.object({
      question: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // For now, create a default user if none exists
      let user = await ctx.prisma.user.findFirst()
      if (!user) {
        user = await ctx.prisma.user.create({
          data: { name: 'Demo User' }
        })
      }

      return ctx.prisma.market.create({
        data: {
          question: input.question,
          description: input.description,
          creatorId: user.id,
        }
      })
    }),

  bet: publicProcedure
    .input(z.object({
      marketId: z.string(),
      outcome: z.enum(['YES', 'NO']),
      amount: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const market = await ctx.prisma.market.findUnique({
        where: { id: input.marketId }
      })
      
      if (!market) throw new Error('Market not found')
      if (market.resolved) throw new Error('Market is resolved')

      // Get or create demo user
      let user = await ctx.prisma.user.findFirst()
      if (!user) {
        user = await ctx.prisma.user.create({
          data: { name: 'Demo User' }
        })
      }

      // Calculate shares from AMM
      const shares = calculateShares(
        market.yesShares,
        market.noShares,
        input.outcome,
        input.amount
      )

      // Update market AMM state
      const updates = input.outcome === 'YES'
        ? { 
            yesShares: market.yesShares - shares,
            noShares: market.noShares + input.amount 
          }
        : { 
            yesShares: market.yesShares + input.amount,
            noShares: market.noShares - shares 
          }

      await ctx.prisma.market.update({
        where: { id: input.marketId },
        data: updates
      })

      // Create bet record
      return ctx.prisma.bet.create({
        data: {
          amount: input.amount,
          outcome: input.outcome,
          shares,
          userId: user.id,
          marketId: input.marketId,
        }
      })
    }),

  resolve: publicProcedure
    .input(z.object({
      marketId: z.string(),
      resolution: z.enum(['YES', 'NO']),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.market.update({
        where: { id: input.marketId },
        data: {
          resolved: true,
          resolution: input.resolution,
        }
      })
    }),
})
