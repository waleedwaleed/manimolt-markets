'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const register = trpc.users.register.useMutation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register.mutateAsync({ name, email, password })

      // Auto sign-in after registration
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Registration succeeded but sign-in failed. Try logging in.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center mt-20">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Create Account</h1>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Display name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
        />
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
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-2 rounded font-medium"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p className="text-sm text-gray-400 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  )
}
