import { prisma } from './prisma'
import { NextRequest } from 'next/server'

export async function authenticateApiKey(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return null
  }
  const apiKey = auth.slice(7)
  if (!apiKey) return null

  const user = await prisma.user.findUnique({ where: { apiKey } })
  return user
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
