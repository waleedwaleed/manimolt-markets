import { NextRequest } from 'next/server'
import { authenticateApiKey, jsonError } from '@/lib/api-auth'

// GET /api/v1/me — Get authenticated user info
export async function GET(req: NextRequest) {
  const user = await authenticateApiKey(req)
  if (!user) return jsonError('Unauthorized', 401)

  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    balance: user.balance,
    createdAt: user.createdAt,
  })
}
