// src/lib/pyth.ts
import { PYTH_FEEDS, ASSET_META, TOTAL_PUBLISHERS } from './config'

const HERMES = process.env.NEXT_PUBLIC_PYTH_HERMES || 'https://hermes.pyth.network'

export interface LivePrice {
  asset: string
  price: number
  confidence: number
  publishTime: number
}

export interface OracleData {
  asset: string
  price: number
  priceFormatted: string
  confidence: number
  confidenceFormatted: string
  certaintyScore: number
  publisherConsensus: number
  deviation: number
  rating: 'EXECUTE' | 'WAIT' | 'ABORT'
  ratingColor: string
  isPro: boolean
  category: string
  name: string
  symbol: string
  icon: string
  iconBg: string
  iconColor: string
  publishTime: number
}

// Fetch one or many assets from Pyth Hermes
export async function fetchPrices(assets: string[]): Promise<Record<string, LivePrice>> {
  const ids = assets
    .map(a => PYTH_FEEDS[a])
    .filter(Boolean)
    .map(id => `ids[]=${id}`)
    .join('&')

  if (!ids) {
    console.error('❌ No valid Pyth feed IDs for assets:', assets)
    return {}
  }

  const url = `${HERMES}/v2/updates/price/latest?${ids}&encoding=hex&parsed=true&ignore_invalid_price_ids=true`

  try {
    console.log('🔍 Pyth request:', url)   // ← You MUST see this in terminal

    const res = await fetch(url, { next: { revalidate: 2 } })

    if (!res.ok) {
      const errText = await res.text().catch(() => 'No body')
      console.error(`Pyth ${res.status}:`, errText)
      throw new Error(`Pyth error ${res.status}`)
    }

    const data = await res.json()

    const result: Record<string, LivePrice> = {}
    for (const item of data.parsed ?? []) {
      const exp = item.price.expo
      const price = Number(item.price.price) * Math.pow(10, exp)
      const conf = Number(item.price.conf) * Math.pow(10, exp)

      const matchedAsset = assets.find(a =>
        PYTH_FEEDS[a]?.toLowerCase().replace(/^0x/, '') === item.id.toLowerCase().replace(/^0x/, '')
      )

      if (matchedAsset) {
        result[matchedAsset] = {
          asset: matchedAsset,
          price,
          confidence: conf,
          publishTime: item.price.publish_time,
        }
      }
    }
    return result
  } catch (err) {
    console.error('Pyth fetch error:', err)
    return {}
  }
}

// Format price for display
export function fmtPrice(price: number, asset: string): string {
  const meta = ASSET_META[asset]
  const d = meta?.decimals ?? 2
  if (price >= 1000) return '$' + price.toLocaleString('en', { maximumFractionDigits: 0 })
  if (price >= 1) return '$' + price.toFixed(d > 2 ? 2 : d)
  return '$' + price.toFixed(d)
}

// Format confidence interval
export function fmtConf(conf: number, asset: string): string {
  if (conf >= 10) return '±$' + conf.toFixed(2)
  if (conf >= 1) return '±$' + conf.toFixed(3)
  if (conf >= 0.01) return '±$' + conf.toFixed(4)
  return '±$' + conf.toFixed(6)
}

// Derive certainty score from confidence data
export function calcCertainty(asset: string, price: number, confidence: number): {
  score: number
  publisherConsensus: number
  deviation: number
  rating: 'EXECUTE' | 'WAIT' | 'ABORT'
  ratingColor: string
} {
  const meta = ASSET_META[asset]
  const baseline = meta?.baselineConfPct ?? 0.001
  const confPct = price > 0 ? confidence / price : 0
  const deviation = Math.max(0.5, confPct / baseline)

  const score = Math.min(100, Math.max(0, Math.round(100 - (deviation - 1) * 38)))
  const publisherConsensus = Math.round(
    TOTAL_PUBLISHERS * Math.min(0.97, Math.max(0.60, 1 - (deviation - 1) * 0.14))
  )

  let rating: 'EXECUTE' | 'WAIT' | 'ABORT'
  let ratingColor: string
  if (score >= 70) { rating = 'EXECUTE'; ratingColor = '#30d158' }
  else if (score >= 50) { rating = 'WAIT'; ratingColor = '#ff9f0a' }
  else { rating = 'ABORT'; ratingColor = '#ff453a' }

  return { score, publisherConsensus, deviation: Math.round(deviation * 10) / 10, rating, ratingColor }
}

// Full oracle data for one asset
export async function getOracleData(asset: string): Promise<OracleData | null> {
  const prices = await fetchPrices([asset])
  const live = prices[asset]
  if (!live) return null

  const meta = ASSET_META[asset]
  if (!meta) return null

  const c = calcCertainty(asset, live.price, live.confidence)

  return {
    asset,
    price: live.price,
    priceFormatted: fmtPrice(live.price, asset),
    confidence: live.confidence,
    confidenceFormatted: fmtConf(live.confidence, asset),
    certaintyScore: c.score,
    publisherConsensus: c.publisherConsensus,
    deviation: c.deviation,
    rating: c.rating,
    ratingColor: c.ratingColor,
    isPro: meta.isPro,
    category: meta.category,
    name: meta.name,
    symbol: meta.symbol,
    icon: meta.icon,
    iconBg: meta.iconBg,
    iconColor: meta.iconColor,
    publishTime: live.publishTime,
  }
}

// Fetch multiple assets for market overview
export async function getMarketSnapshot(assets: string[]): Promise<OracleData[]> {
  const prices = await fetchPrices(assets)
  const results: OracleData[] = []

  for (const asset of assets) {
    const live = prices[asset]
    const meta = ASSET_META[asset]
    if (!live || !meta) continue

    const c = calcCertainty(asset, live.price, live.confidence)
    results.push({
      asset,
      price: live.price,
      priceFormatted: fmtPrice(live.price, asset),
      confidence: live.confidence,
      confidenceFormatted: fmtConf(live.confidence, asset),
      certaintyScore: c.score,
      publisherConsensus: c.publisherConsensus,
      deviation: c.deviation,
      rating: c.rating,
      ratingColor: c.ratingColor,
      isPro: meta.isPro,
      category: meta.category,
      name: meta.name,
      symbol: meta.symbol,
      icon: meta.icon,
      iconBg: meta.iconBg,
      iconColor: meta.iconColor,
      publishTime: live.publishTime,
    })
  }
  return results
}