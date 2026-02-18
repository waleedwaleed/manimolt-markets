'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex justify-center mt-20">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-2 rounded font-medium"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-sm text-gray-400 text-center">
          No account?{' '}
          <Link href="/register" className="text-blue-400 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  )
}
