import { PYTH_FEEDS, ASSET_META, TOTAL_PUBLISHERS } from './config'

const HERMES = process.env.NEXT_PUBLIC_PYTH_HERMES || 'https://hermes.pyth.network'

export interface LivePrice {
  asset: string
  price: number
  emaPrice: number
  priceChangeFromEMA: number
  confidence: number
  publishTime: number
}

export interface OracleData {
  asset: string
  price: number
  priceFormatted: string
  emaPrice: number
  priceChangeFromEMA: number
  confidence: number
  confidenceFormatted: string
  certaintyScore: number
  publisherConsensus: number
  deviation: number
  rating: 'EXECUTE' | 'WAIT' | 'ABORT'
  ratingColor: string
  momentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  momentumColor: string
  isPro: boolean
  category: string
  name: string
  symbol: string
  icon: string
  iconBg: string
  iconColor: string
  publishTime: number
  newsInsight: string
}

// Fetch prices with EMA support
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
    console.log('🔍 Pyth request:', url)

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

      const emaExp = item.ema_price?.expo ?? exp
      const emaPrice = Number(item.ema_price?.price || item.price.price) * Math.pow(10, emaExp)

      const conf = Number(item.price.conf) * Math.pow(10, exp)

      const matchedAsset = assets.find(a =>
        PYTH_FEEDS[a]?.toLowerCase().replace(/^0x/, '') === 
        item.id.toLowerCase().replace(/^0x/, '')
      )

      if (matchedAsset) {
        result[matchedAsset] = {
          asset: matchedAsset,
          price,
          emaPrice,
          priceChangeFromEMA: price - emaPrice,
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

// Improved certainty that factors in EMA deviation
export function calcCertainty(
  asset: string, 
  price: number, 
  confidence: number, 
  emaPrice?: number
): {
  score: number
  publisherConsensus: number
  deviation: number
  rating: 'EXECUTE' | 'WAIT' | 'ABORT'
  ratingColor: string
} {
  const meta = ASSET_META[asset]
  const baseline = meta?.baselineConfPct ?? 0.001
  const confPct = price > 0 ? confidence / price : 0

  // Extra penalty if price deviates significantly from EMA
  let emaDeviation = 0
  if (emaPrice && emaPrice > 0) {
    emaDeviation = Math.abs(price - emaPrice) / price
  }

  const totalDeviation = Math.max(0.5, (confPct / baseline) + (emaDeviation * 0.6))

  const score = Math.min(100, Math.max(0, Math.round(100 - (totalDeviation - 1) * 42)))

  const publisherConsensus = Math.round(
    TOTAL_PUBLISHERS * Math.min(0.97, Math.max(0.60, 1 - (totalDeviation - 1) * 0.16))
  )

  let rating: 'EXECUTE' | 'WAIT' | 'ABORT'
  let ratingColor: string

  if (score >= 72) { 
    rating = 'EXECUTE'; 
    ratingColor = '#30d158' 
  } else if (score >= 50) { 
    rating = 'WAIT'; 
    ratingColor = '#ff9f0a' 
  } else { 
    rating = 'ABORT'; 
    ratingColor = '#ff453a' 
  }

  return { 
    score, 
    publisherConsensus, 
    deviation: Math.round(totalDeviation * 10) / 10, 
    rating, 
    ratingColor 
  }
}

// Format price
export function fmtPrice(price: number, asset: string): string {
  const meta = ASSET_META[asset] || ASSET_META['BTC']
  const d = meta?.decimals ?? 2
  if (price >= 1000) return '$' + price.toLocaleString('en', { maximumFractionDigits: 0 })
  if (price >= 1) return '$' + price.toFixed(d > 2 ? 2 : d)
  return '$' + price.toFixed(d)
}

// Format confidence
export function fmtConf(conf: number, asset: string): string {
  if (conf >= 10) return '±$' + conf.toFixed(2)
  if (conf >= 1) return '±$' + conf.toFixed(3)
  if (conf >= 0.01) return '±$' + conf.toFixed(4)
  return '±$' + conf.toFixed(6)
}

// Full oracle data for one asset
export async function getOracleData(asset: string): Promise<OracleData> {
  const prices = await fetchPrices([asset])
  const live = prices[asset]

  const meta = ASSET_META[asset] || {
    name: asset.toUpperCase().replace('_', ' '),
    symbol: asset.toUpperCase(),
    icon: '📈',
    iconBg: '#666666',
    iconColor: '#ffffff',
    category: 'unknown' as const,
    isPro: false,
    decimals: 2,
    baselineConfPct: 0.001,
  }

  if (!live) {
    return {
      asset,
      price: 0,
      priceFormatted: 'Data temporarily unavailable',
      emaPrice: 0,
      priceChangeFromEMA: 0,
      confidence: 0,
      confidenceFormatted: '—',
      certaintyScore: 45,
      publisherConsensus: 0,
      deviation: 5,
      rating: 'WAIT' as const,
      ratingColor: '#ff9f0a',
      momentum: 'NEUTRAL' as const,
      momentumColor: '#ff9f0a',
      isPro: meta.isPro,
      category: meta.category,
      name: meta.name,
      symbol: meta.symbol,
      icon: meta.icon,
      iconBg: meta.iconBg,
      iconColor: meta.iconColor,
      publishTime: Date.now(),
      newsInsight: `Pyth Network is monitoring ${meta.name}.`,
    } as OracleData
  }

  const c = calcCertainty(asset, live.price, live.confidence, live.emaPrice)

  // Momentum calculation
  let momentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
  let momentumColor = '#ff9f0a'
  const pctFromEMA = live.price > 0 ? (live.priceChangeFromEMA / live.price) * 100 : 0

  if (pctFromEMA > 0.3) {
    momentum = 'BULLISH'
    momentumColor = '#30d158'
  } else if (pctFromEMA < -0.3) {
    momentum = 'BEARISH'
    momentumColor = '#ff453a'
  }

  return {
    asset,
    price: live.price,
    priceFormatted: fmtPrice(live.price, asset),
    emaPrice: live.emaPrice,
    priceChangeFromEMA: live.priceChangeFromEMA,
    confidence: live.confidence,
    confidenceFormatted: fmtConf(live.confidence, asset),
    certaintyScore: c.score,
    publisherConsensus: c.publisherConsensus,
    deviation: c.deviation,
    rating: c.rating,
    ratingColor: c.ratingColor,
    momentum,
    momentumColor,
    isPro: meta.isPro,
    category: meta.category,
    name: meta.name,
    symbol: meta.symbol,
    icon: meta.icon,
    iconBg: meta.iconBg,
    iconColor: meta.iconColor,
    publishTime: live.publishTime,
    newsInsight: '',
  } as OracleData
}

// Market snapshot - now uses getOracleData for consistency
export async function getMarketSnapshot(assets: string[]): Promise<OracleData[]> {
  const results = await Promise.all(
    assets.map(asset => getOracleData(asset))
  )
  return results.filter(Boolean)
}