import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiKey, jsonError } from '@/lib/api-auth'

// GET /api/v1/markets — List all markets
export async function GET() {
  const markets = await prisma.market.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { name: true } },
      _count: { select: { bets: true } },
    },
  })

  return Response.json(
    markets.map((m) => ({
      id: m.id,
      question: m.question,
      description: m.description,
      probability: m.noShares / (m.yesShares + m.noShares),
      volume: m.volume,
      resolved: m.resolved,
      resolution: m.resolution,
      creatorName: m.creator.name,
      totalBets: m._count.bets,
      closesAt: m.closesAt,
      createdAt: m.createdAt,
    }))
  )
}

// POST /api/v1/markets — Create a market (requires API key)
export async function POST(req: NextRequest) {
  const user = await authenticateApiKey(req)
  if (!user) return jsonError('Unauthorized. Provide a valid API key in Authorization: Bearer <key>', 401)

  let body: { question?: string; description?: string; closesAt?: string }
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  if (!body.question || typeof body.question !== 'string' || body.question.length === 0) {
    return jsonError('question is required', 400)
  }
  if (body.question.length > 500) {
    return jsonError('question must be 500 characters or less', 400)
  }

  const market = await prisma.market.create({
    data: {
      question: body.question,
      description: body.description || null,
      closesAt: body.closesAt ? new Date(body.closesAt) : null,
      creatorId: user.id,
    },
  })

  await prisma.pricePoint.create({
    data: { marketId: market.id, prob: 0.5 },
  })

  return Response.json({
    id: market.id,
    question: market.question,
    description: market.description,
    probability: 0.5,
    closesAt: market.closesAt,
    createdAt: market.createdAt,
  }, { status: 201 })
}
