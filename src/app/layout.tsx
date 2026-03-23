// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Veridian — Ask the market anything',
  description: 'Type any asset, question, or comparison. Get live Pyth oracle intelligence in seconds.',
  openGraph: {
    title: 'Veridian — Ask the market anything',
    description: 'Live oracle intelligence powered by Pyth Network.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
