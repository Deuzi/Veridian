// src/lib/entropy.ts
import { OracleData } from './pyth'

export interface EntropyBaseline {
  seed: string
  sequence: number
  globalDeviation: number
  macroAlertActive: boolean
  alertAssets: string[]
  moodScore: number
  moodLabel: string
  moodColor: string
}

// Derive entropy seed from live price variance
function deriveSeed(prices: Record<string, number>): string {
  const vals = Object.values(prices)
  if (!vals.length) return '0x00000000'
  let hash = 0
  const ts = Math.floor(Date.now() / 1000)
  for (let i = 0; i < vals.length; i++) {
    hash = ((hash << 5) - hash + Math.round(vals[i] * 100)) | 0
  }
  hash = ((hash << 5) - hash + ts) | 0
  return '0x' + Math.abs(hash).toString(16).padStart(8, '0')
}

export function buildEntropyBaseline(assets: OracleData[]): EntropyBaseline {
  const pricesMap: Record<string, number> = {}
  const devsMap: Record<string, number> = {}

  for (const a of assets) {
    pricesMap[a.asset] = a.price
    devsMap[a.asset] = a.deviation
  }

  const devs = Object.values(devsMap)
  const avgDev = devs.length ? devs.reduce((a, b) => a + b, 0) / devs.length : 1

  // Alert assets: any with deviation >= 2
  const alertAssets = assets.filter(a => a.deviation >= 2).map(a => a.asset)

  // Macro alert: 2+ asset classes in distress simultaneously
  const categories = new Set(
    assets.filter(a => a.deviation >= 2).map(a => a.category)
  )
  const macroAlertActive = categories.size >= 2

  // Market mood score: inverse of average deviation
  const moodScore = Math.min(100, Math.max(0, Math.round(100 - (avgDev - 1) * 35)))

  let moodLabel: string
  let moodColor: string
  if (moodScore >= 70) { moodLabel = 'Calm — oracle feeds healthy across markets.'; moodColor = '#30d158' }
  else if (moodScore >= 45) { moodLabel = 'Mixed — some publisher divergence detected.'; moodColor = '#ff9f0a' }
  else { moodLabel = 'Stressed — multiple asset classes showing elevated divergence.'; moodColor = '#ff453a' }

  return {
    seed: deriveSeed(pricesMap),
    sequence: Math.floor(Date.now() / 2000) + 48000,
    globalDeviation: Math.round(avgDev * 10) / 10,
    macroAlertActive,
    alertAssets,
    moodScore,
    moodLabel,
    moodColor,
  }
}
