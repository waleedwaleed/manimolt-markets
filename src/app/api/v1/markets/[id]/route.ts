import { prisma } from '@/lib/prisma'
import { jsonError } from '@/lib/api-auth'

// GET /api/v1/markets/:id — Get market details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      bets: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { name: true } } },
      },
      priceHistory: {
        orderBy: { createdAt: 'asc' },
        select: { prob: true, createdAt: true },
      },
    },
  })

  if (!market) return jsonError('Market not found', 404)

  return Response.json({
    id: market.id,
    question: market.question,
    description: market.description,
    probability: market.noShares / (market.yesShares + market.noShares),
    yesShares: market.yesShares,
    noShares: market.noShares,
    volume: market.volume,
    resolved: market.resolved,
    resolution: market.resolution,
    creator: market.creator,
    closesAt: market.closesAt,
    createdAt: market.createdAt,
    bets: market.bets.map((b) => ({
      id: b.id,
      amount: b.amount,
      outcome: b.outcome,
      shares: b.shares,
      probAfter: b.probAfter,
      userName: b.user.name,
      createdAt: b.createdAt,
    })),
    priceHistory: market.priceHistory,
  })
}
