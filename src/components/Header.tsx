'use client'

import { trpc } from '@/lib/trpc'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export function Header() {
  const { data: session, status } = useSession()
  const { data: user } = trpc.users.me.useQuery(undefined, {
    enabled: status === 'authenticated',
  })

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
          {status === 'authenticated' ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">{session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-400 hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-300 hover:text-white">
                Login
              </Link>
              <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded">
                Register
              </Link>
            </div>
          )}
          <span className="text-gray-500 text-xs">v0.3</span>
        </div>
      </div>
    </nav>
  )
}
