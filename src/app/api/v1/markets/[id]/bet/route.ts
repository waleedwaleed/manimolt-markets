import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiKey, jsonError } from '@/lib/api-auth'

function calculateShares(yesShares: number, noShares: number, outcome: 'YES' | 'NO', amount: number) {
  const k = yesShares * noShares
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

// POST /api/v1/markets/:id/bet — Place a bet
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateApiKey(req)
  if (!user) return jsonError('Unauthorized', 401)

  const { id: marketId } = await params

  let body: { outcome?: string; amount?: number }
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  if (body.outcome !== 'YES' && body.outcome !== 'NO') {
    return jsonError('outcome must be "YES" or "NO"', 400)
  }
  if (typeof body.amount !== 'number' || body.amount <= 0 || body.amount > 10000) {
    return jsonError('amount must be a positive number (max 10000)', 400)
  }

  const outcome = body.outcome as 'YES' | 'NO'
  const amount = body.amount

  try {
    const result = await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUnique({ where: { id: marketId } })
      if (!market) throw new Error('NOT_FOUND:Market not found')
      if (market.resolved) throw new Error('BAD_REQUEST:Market is resolved')
      if (market.closesAt && new Date() > market.closesAt) throw new Error('BAD_REQUEST:Market is closed')

      const freshUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } })
      if (freshUser.balance < amount) {
        throw new Error(`BAD_REQUEST:Insufficient balance. You have Ṁ${freshUser.balance.toFixed(0)}`)
      }

      const shares = calculateShares(market.yesShares, market.noShares, outcome, amount)

      const updates = outcome === 'YES'
        ? { yesShares: market.yesShares - shares, noShares: market.noShares + amount, volume: market.volume + amount }
        : { yesShares: market.yesShares + amount, noShares: market.noShares - shares, volume: market.volume + amount }

      const updatedMarket = await tx.market.update({ where: { id: marketId }, data: updates })
      const newProb = updatedMarket.noShares / (updatedMarket.yesShares + updatedMarket.noShares)

      await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: amount } } })

      const bet = await tx.bet.create({
        data: { amount, outcome, shares, probAfter: newProb, userId: user.id, marketId },
      })

      await tx.pricePoint.create({ data: { marketId, prob: newProb } })

      return { bet, newProb, shares }
    })

    return Response.json({
      id: result.bet.id,
      outcome,
      amount,
      shares: result.shares,
      probability: result.newProb,
    }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg.startsWith('NOT_FOUND:')) return jsonError(msg.slice(10), 404)
    if (msg.startsWith('BAD_REQUEST:')) return jsonError(msg.slice(12), 400)
    return jsonError('Internal server error', 500)
  }
}
