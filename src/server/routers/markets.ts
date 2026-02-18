import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

// Simple constant-product AMM
function calculateShares(yesShares: number, noShares: number, outcome: 'YES' | 'NO', amount: number) {
  const k = yesShares * noShares // invariant
  
  if (outcome === 'YES') {
    const newNoShares = noShares + amount
    const newYesShares = k / newNoShares
    return yesShares - newYesShares
  } else {
    const newYesShares = yesShares + amount
    const newNoShares = k / newYesShares
    return noShares - newNoShares
  }
}

function calculateProb(yesShares: number, noShares: number): number {
  return noShares / (yesShares + noShares)
}

export const marketsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.market.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        creator: { select: { name: true } },
        _count: { select: { bets: true } }
      }
    })
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const market = await ctx.prisma.market.findUnique({
        where: { id: input.id },
        include: {
          creator: { select: { id: true, name: true } },
          bets: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { user: { select: { name: true } } }
          },
          priceHistory: {
            orderBy: { createdAt: 'asc' },
            select: { prob: true, createdAt: true }
          }
        }
      })
      
      if (!market) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Market not found' })
      }
      
      return market
    }),

  create: protectedProcedure
    .input(z.object({
      question: z.string().min(1).max(500),
      description: z.string().max(5000).optional(),
      closesAt: z.string().datetime().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const market = await ctx.prisma.market.create({
        data: {
          question: input.question,
          description: input.description,
          closesAt: input.closesAt ? new Date(input.closesAt) : null,
          creatorId: ctx.userId,
        }
      })

      await ctx.prisma.pricePoint.create({
        data: { marketId: market.id, prob: 0.5 }
      })

      return market
    }),

  bet: protectedProcedure
    .input(z.object({
      marketId: z.string(),
      outcome: z.enum(['YES', 'NO']),
      amount: z.number().positive().max(10000),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const market = await tx.market.findUnique({
          where: { id: input.marketId }
        })
        
        if (!market) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Market not found' })
        }
        if (market.resolved) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Market is resolved' })
        }
        if (market.closesAt && new Date() > market.closesAt) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Market is closed' })
        }

        const user = await tx.user.findUniqueOrThrow({
          where: { id: ctx.userId }
        })

        if (user.balance < input.amount) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: `Insufficient balance. You have Ṁ${user.balance.toFixed(0)}` 
          })
        }

        const shares = calculateShares(
          market.yesShares, market.noShares, input.outcome, input.amount
        )

        const updates = input.outcome === 'YES'
          ? { 
              yesShares: market.yesShares - shares,
              noShares: market.noShares + input.amount,
              volume: market.volume + input.amount
            }
          : { 
              yesShares: market.yesShares + input.amount,
              noShares: market.noShares - shares,
              volume: market.volume + input.amount
            }

        const updatedMarket = await tx.market.update({
          where: { id: input.marketId },
          data: updates
        })

        const newProb = calculateProb(updatedMarket.yesShares, updatedMarket.noShares)

        await tx.user.update({
          where: { id: ctx.userId },
          data: { balance: { decrement: input.amount } }
        })

        const bet = await tx.bet.create({
          data: {
            amount: input.amount,
            outcome: input.outcome,
            shares,
            probAfter: newProb,
            userId: ctx.userId,
            marketId: input.marketId,
          }
        })

        await tx.pricePoint.create({
          data: { marketId: input.marketId, prob: newProb }
        })

        return { bet, newProb, shares }
      })
    }),

  resolve: protectedProcedure
    .input(z.object({
      marketId: z.string(),
      resolution: z.enum(['YES', 'NO']),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const market = await tx.market.findUnique({
          where: { id: input.marketId },
          include: { bets: true }
        })

        if (!market) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Market not found' })
        }
        if (market.resolved) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Market already resolved' })
        }
        if (market.creatorId !== ctx.userId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the creator can resolve' })
        }

        const winningBets = market.bets.filter(b => b.outcome === input.resolution)
        
        for (const bet of winningBets) {
          await tx.user.update({
            where: { id: bet.userId },
            data: { balance: { increment: bet.shares } }
          })
        }

        const resolved = await tx.market.update({
          where: { id: input.marketId },
          data: { resolved: true, resolution: input.resolution }
        })

        await tx.pricePoint.create({
          data: { marketId: input.marketId, prob: input.resolution === 'YES' ? 1 : 0 }
        })

        return {
          market: resolved,
          payouts: winningBets.map(b => ({ userId: b.userId, payout: b.shares }))
        }
      })
    }),
})
