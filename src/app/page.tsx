'use client'

import { trpc } from '@/lib/trpc'
import { useState } from 'react'

export default function Home() {
  const { data: markets, isLoading } = trpc.markets.list.useQuery()
  const [showCreate, setShowCreate] = useState(false)

  if (isLoading) {
    return <div className="text-center py-8">Loading markets...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Markets</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          + New Market
        </button>
      </div>

      {showCreate && <CreateMarket onClose={() => setShowCreate(false)} />}

      {markets?.length === 0 && (
        <p className="text-gray-400 text-center py-8">
          No markets yet. Create one!
        </p>
      )}

      <div className="grid gap-4">
        {markets?.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  )
}

function MarketCard({ market }: { market: any }) {
  const utils = trpc.useUtils()
  const bet = trpc.markets.bet.useMutation({
    onSuccess: () => utils.markets.list.invalidate()
  })

  // Calculate probability from AMM
  const prob = market.noShares / (market.yesShares + market.noShares)
  const yesPct = Math.round(prob * 100)
  const noPct = 100 - yesPct

  const handleBet = (outcome: 'YES' | 'NO') => {
    const amount = prompt('How much to bet?')
    if (amount) {
      bet.mutate({ marketId: market.id, outcome, amount: parseFloat(amount) })
    }
  }

  return (
    <div className="border border-gray-700 rounded-lg p-4 hover:border-gray-600">
      <h3 className="font-semibold text-lg">{market.question}</h3>
      {market.description && (
        <p className="text-gray-400 text-sm mt-1">{market.description}</p>
      )}
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => handleBet('YES')}
          disabled={market.resolved}
          className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600 rounded px-4 py-2 disabled:opacity-50"
        >
          YES {yesPct}%
        </button>
        <button
          onClick={() => handleBet('NO')}
          disabled={market.resolved}
          className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600 rounded px-4 py-2 disabled:opacity-50"
        >
          NO {noPct}%
        </button>
      </div>

      {market.resolved && (
        <div className="mt-2 text-center text-sm">
          Resolved: <span className="font-bold">{market.resolution}</span>
        </div>
      )}
    </div>
  )
}

function CreateMarket({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils()
  const create = trpc.markets.create.useMutation({
    onSuccess: () => {
      utils.markets.list.invalidate()
      onClose()
    }
  })
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    create.mutate({ question, description })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-700 rounded-lg p-4 space-y-4">
      <input
        type="text"
        placeholder="Will X happen by Y date?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
        required
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
        rows={2}
      />
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Create
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400">
          Cancel
        </button>
      </div>
    </form>
  )
}
