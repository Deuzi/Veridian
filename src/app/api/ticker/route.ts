// src/app/api/ticker/route.ts
import { NextResponse } from 'next/server'
import { getMarketSnapshot } from '@/lib/pyth'

const TICKER_ASSETS = ['BTC', 'ETH', 'SOL', 'AVAX']

function scoreColor(score: number) {
  if (score >= 70) return '#30d158'
  if (score >= 50) return '#ff9f0a'
  return '#ff453a'
}

export async function GET() {
  try {
    const assets = await getMarketSnapshot(TICKER_ASSETS)
    const prices: Record<string, { price: string; score: number; color: string }> = {}
    for (const a of assets) {
      prices[a.asset] = {
        price: a.priceFormatted,
        score: a.certaintyScore,
        color: scoreColor(a.certaintyScore),
      }
    }
    return NextResponse.json({ prices, updatedAt: Date.now() })
  } catch {
    return NextResponse.json({ prices: {} })
  }
}