import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcrypt'

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
    return { id: user.id, name: user.name, email: user.email, balance: user.balance }
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

  register: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      password: z.string().min(6).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already in use' })
      }

      const passwordHash = await bcrypt.hash(input.password, 10)
      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
        },
      })

      return { id: user.id, name: user.name, email: user.email }
    }),
})
