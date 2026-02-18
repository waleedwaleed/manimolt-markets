import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function createContext() {
  const session = await getServerSession(authOptions)
  return { prisma, session }
}

export type Context = Awaited<ReturnType<typeof createContext>>
