import './globals.css'
import type { Metadata } from 'next'
import { TRPCProvider } from '@/lib/trpc-provider'
import { Header } from '@/components/Header'

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
          <Header />
          <main className="max-w-4xl mx-auto p-4">
            {children}
          </main>
        </TRPCProvider>
      </body>
    </html>
  )
}
