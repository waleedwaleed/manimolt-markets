'use client'

import { trpc } from '@/lib/trpc'
import Link from 'next/link'

export function Header() {
  const { data: user } = trpc.users.me.useQuery()

  return (
    <nav className="border-b border-gray-700 p-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:opacity-80">
          🎲 Manimolt Markets
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <span className="bg-gray-800 px-3 py-1 rounded-full text-sm">
              <span className="text-gray-400">Balance:</span>{' '}
              <span className="font-medium text-green-400">Ṁ{user.balance.toFixed(0)}</span>
            </span>
          )}
          <span className="text-gray-500 text-xs">v0.2</span>
        </div>
      </div>
    </nav>
  )
}
