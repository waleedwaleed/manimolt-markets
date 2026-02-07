'use client'

import { trpc } from '@/lib/trpc'
import Link from 'next/link'
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
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
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
  // Calculate probability from AMM
  const prob = market.noShares / (market.yesShares + market.noShares)
  const yesPct = Math.round(prob * 100)
  const noPct = 100 - yesPct

  return (
    <Link href={`/market/${market.id}`}>
      <div className="border border-gray-700 rounded-lg p-4 hover:border-gray-500 hover:bg-gray-800/50 transition cursor-pointer">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{market.question}</h3>
            {market.description && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{market.description}</p>
            )}
            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              <span>{market.creator.name}</span>
              <span>•</span>
              <span>Ṁ{market.volume?.toFixed(0) ?? 0} vol</span>
              <span>•</span>
              <span>{market._count.bets} bets</span>
            </div>
          </div>

          <div className="text-right">
            {market.resolved ? (
              <div className={`px-3 py-1 rounded font-bold ${
                market.resolution === 'YES' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
              }`}>
                {market.resolution}
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="bg-green-600/20 border border-green-600/50 rounded px-3 py-1">
                  <div className="text-xs text-gray-400">YES</div>
                  <div className="font-bold text-green-400">{yesPct}%</div>
                </div>
                <div className="bg-red-600/20 border border-red-600/50 rounded px-3 py-1">
                  <div className="text-xs text-gray-400">NO</div>
                  <div className="font-bold text-red-400">{noPct}%</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
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
    <form onSubmit={handleSubmit} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Question</label>
        <input
          type="text"
          placeholder="Will X happen by Y date?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
        <textarea
          placeholder="Resolution criteria, context, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <button 
          type="submit" 
          disabled={create.isLoading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium disabled:opacity-50"
        >
          {create.isLoading ? 'Creating...' : 'Create Market'}
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  )
}
