import './globals.css'
import type { Metadata } from 'next'
import { TRPCProvider } from '@/lib/trpc-provider'

export const metadata: Metadata = {
  title: 'Manimolt Markets',
  description: 'Play-money prediction markets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <TRPCProvider>
          <nav className="border-b border-gray-700 p-4">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">🎲 Manimolt Markets</h1>
              <span className="text-gray-400 text-sm">v0.1</span>
            </div>
          </nav>
          <main className="max-w-4xl mx-auto p-4">
            {children}
          </main>
        </TRPCProvider>
      </body>
    </html>
  )
}
