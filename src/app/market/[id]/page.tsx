'use client'

import { trpc } from '@/lib/trpc'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MarketPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const { data: market, isLoading, error } = trpc.markets.get.useQuery({ id })
  const { data: user } = trpc.users.me.useQuery()
  const utils = trpc.useUtils()
  
  const bet = trpc.markets.bet.useMutation({
    onSuccess: () => {
      utils.markets.get.invalidate({ id })
      utils.users.me.invalidate()
    }
  })
  
  const resolve = trpc.markets.resolve.useMutation({
    onSuccess: () => {
      utils.markets.get.invalidate({ id })
      utils.users.me.invalidate()
    }
  })

  const [betAmount, setBetAmount] = useState(10)

  if (isLoading) {
    return <div className="text-center py-12">Loading market...</div>
  }

  if (error || !market) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Market not found</p>
        <button onClick={() => router.push('/')} className="mt-4 text-blue-400 hover:underline">
          ← Back to markets
        </button>
      </div>
    )
  }

  // Calculate current probability
  const prob = market.noShares / (market.yesShares + market.noShares)
  const yesPct = Math.round(prob * 100)
  const noPct = 100 - yesPct

  // Format price history for chart
  const chartData = market.priceHistory.map((p, i) => ({
    time: new Date(p.createdAt).toLocaleDateString(),
    prob: Math.round(p.prob * 100),
    index: i
  }))

  const handleBet = (outcome: 'YES' | 'NO') => {
    if (betAmount <= 0) return
    bet.mutate({ marketId: id, outcome, amount: betAmount })
  }

  const handleResolve = (resolution: 'YES' | 'NO') => {
    if (confirm(`Resolve this market as ${resolution}?`)) {
      resolve.mutate({ marketId: id, resolution })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white">
        ← All markets
      </button>

      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">{market.question}</h1>
        {market.description && (
          <p className="text-gray-400 mb-4">{market.description}</p>
        )}
        
        <div className="flex gap-4 text-sm text-gray-400">
          <span>Created by {market.creator.name}</span>
          <span>•</span>
          <span>Ṁ{market.volume.toFixed(0)} volume</span>
          {market.closesAt && (
            <>
              <span>•</span>
              <span>Closes {new Date(market.closesAt).toLocaleDateString()}</span>
            </>
          )}
        </div>

        {market.resolved && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg text-center">
            <span className="text-gray-400">Resolved: </span>
            <span className={`font-bold text-lg ${market.resolution === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
              {market.resolution}
            </span>
          </div>
        )}
      </div>

      {/* Price Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Probability Over Time</h2>
        <div className="h-48">
          {chartData.length > 1 ? (
            <SimpleChart data={chartData} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No trading activity yet
            </div>
          )}
        </div>
      </div>

      {/* Betting Panel */}
      {!market.resolved && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Place a Bet</h2>
          
          {user && (
            <p className="text-sm text-gray-400 mb-4">
              Your balance: <span className="text-white font-medium">Ṁ{user.balance.toFixed(0)}</span>
            </p>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                min={1}
                max={user?.balance ?? 1000}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <button
              onClick={() => handleBet('YES')}
              disabled={bet.isLoading}
              className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600 rounded px-4 py-2 font-medium disabled:opacity-50"
            >
              YES {yesPct}%
            </button>
            <button
              onClick={() => handleBet('NO')}
              disabled={bet.isLoading}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600 rounded px-4 py-2 font-medium disabled:opacity-50"
            >
              NO {noPct}%
            </button>
          </div>

          {bet.error && (
            <p className="mt-2 text-red-400 text-sm">{bet.error.message}</p>
          )}

          {/* Quick amounts */}
          <div className="flex gap-2 mt-3">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
              >
                Ṁ{amt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Controls (for creator) */}
      {!market.resolved && user?.id === market.creator.id && (
        <div className="bg-gray-800 rounded-lg p-6 border border-yellow-600/50">
          <h2 className="text-lg font-semibold mb-2">Resolve Market</h2>
          <p className="text-sm text-gray-400 mb-4">
            As the creator, you can resolve this market.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => handleResolve('YES')}
              disabled={resolve.isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 rounded px-4 py-2 font-medium disabled:opacity-50"
            >
              Resolve YES
            </button>
            <button
              onClick={() => handleResolve('NO')}
              disabled={resolve.isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 rounded px-4 py-2 font-medium disabled:opacity-50"
            >
              Resolve NO
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {market.bets.length === 0 ? (
          <p className="text-gray-500">No bets yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {market.bets.map((bet) => (
              <div key={bet.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                <div>
                  <span className="font-medium">{bet.user.name}</span>
                  <span className="text-gray-400"> bet </span>
                  <span className={bet.outcome === 'YES' ? 'text-green-400' : 'text-red-400'}>
                    {bet.outcome}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm">Ṁ{bet.amount.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(bet.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Simple SVG-based chart component
function SimpleChart({ data }: { data: { prob: number; time: string }[] }) {
  const width = 100
  const height = 100
  const padding = 5

  // Generate SVG path
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - (d.prob / 100) * (height - 2 * padding)
    return `${x},${y}`
  })

  const pathD = `M ${points.join(' L ')}`

  // Area fill path
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`

  const currentProb = data[data.length - 1]?.prob ?? 50

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#374151" strokeDasharray="2,2" />
          
          {/* Area fill */}
          <path d={areaD} fill="url(#gradient)" opacity="0.3" />
          
          {/* Line */}
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
          </defs>
        </svg>

        {/* Current value indicator */}
        <div className="absolute top-2 right-2 bg-gray-700 px-2 py-1 rounded text-sm">
          <span className="text-blue-400 font-bold">{currentProb}%</span>
          <span className="text-gray-400 ml-1">YES</span>
        </div>
      </div>

      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{data[0]?.time}</span>
        <span>50%</span>
        <span>{data[data.length - 1]?.time}</span>
      </div>
    </div>
  )
}
