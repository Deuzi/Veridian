// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { detectAssets, generateVerdict, isMarketRelated, notMarketResponse, QueryType } from '@/lib/groq'
import { getMarketSnapshot } from '@/lib/pyth'
import { buildEntropyBaseline } from '@/lib/entropy'

export const runtime = 'edge'

// Core crypto assets — always available, no Pro key needed
const CRYPTO_ASSETS = ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK', 'BNB']

// Pro assets — need Pyth Pro key
const PRO_ASSETS = ['SPX', 'TSLA', 'NVDA', 'AAPL', 'EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'XAG_USD', 'WTI_USD']

// Default overview: crypto only if no Pro key, full market if Pro key present
const OVERVIEW_ASSETS = ['BTC', 'ETH', 'SOL', 'AVAX']
const OVERVIEW_ASSETS_PRO = ['BTC', 'ETH', 'SOL', 'AVAX', 'XAU_USD', 'SPX', 'EUR_USD', 'WTI_USD']

const RELATED: Record<string, string[]> = {
  BTC: ['ETH', 'SOL', 'AVAX'],
  ETH: ['BTC', 'SOL', 'AVAX'],
  SOL: ['ETH', 'BTC', 'AVAX'],
  AVAX: ['SOL', 'ETH', 'LINK'],
  LINK: ['ETH', 'BTC', 'SOL'],
  BNB: ['ETH', 'BTC', 'SOL'],
  XAU_USD: ['WTI_USD', 'XAG_USD', 'BTC'],
  WTI_USD: ['XAU_USD', 'XAG_USD', 'SPX'],
  XAG_USD: ['XAU_USD', 'WTI_USD', 'SPX'],
  SPX: ['TSLA', 'NVDA', 'AAPL'],
  TSLA: ['NVDA', 'AAPL', 'SPX'],
  NVDA: ['TSLA', 'AAPL', 'SPX'],
  AAPL: ['TSLA', 'NVDA', 'SPX'],
  EUR_USD: ['GBP_USD', 'USD_JPY', 'XAU_USD'],
  GBP_USD: ['EUR_USD', 'USD_JPY', 'XAG_USD'],
  USD_JPY: ['EUR_USD', 'GBP_USD', 'XAU_USD'],
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const query: string = (body.query ?? '').trim()

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    // Step 1 — check if market-related
    if (!isMarketRelated(query)) {
      return NextResponse.json({
        success: true,
        queryType: 'unknown',
        isMarketQuery: false,
        primaryAssets: [],
        relatedAssets: [],
        entropy: null,
        response: notMarketResponse(query),
        updatedAt: Date.now(),
      })
    }

    // Step 2 — detect assets
    const detectedAssets = detectAssets(query)
    const hasPro = !!process.env.PYTH_PRO_API_KEY

    // Filter out Pro assets if no key
    const validDetected = hasPro
      ? detectedAssets
      : detectedAssets.filter(a => !PRO_ASSETS.includes(a))

    const isOverview = validDetected.length === 0
    const isComparison = validDetected.length >= 2

    let queryType: QueryType
    if (isOverview) queryType = 'overview'
    else if (isComparison) queryType = 'comparison'
    else queryType = 'single'

    // Step 3 — fetch live Pyth data
    const overviewList = hasPro ? OVERVIEW_ASSETS_PRO : OVERVIEW_ASSETS
    const toFetch = isOverview
      ? overviewList
      : Array.from(new Set([...validDetected, ...CRYPTO_ASSETS.slice(0, 3)]))

    const allOracleData = await getMarketSnapshot(toFetch)

    // If we got nothing back at all — Pyth might be down
    if (allOracleData.length === 0) {
      return NextResponse.json(
        { error: 'Could not fetch live market data. Please try again.' },
        { status: 503 }
      )
    }

    // Step 4 — entropy baseline
    const entropy = buildEntropyBaseline(allOracleData)

    // Step 5 — relevant assets for verdict
    const relevantAssets = isOverview
      ? allOracleData
      : allOracleData.filter(a => validDetected.includes(a.asset))

    // If a specific asset was asked for but we got no data (e.g. Pro asset without key)
    // fall back to showing what we have
    const verdictAssets = relevantAssets.length > 0 ? relevantAssets : allOracleData.slice(0, 2)

    // Step 6 — Groq AI verdict
    const verdict = await generateVerdict(query, verdictAssets, entropy, queryType)

    // Step 7 — related assets
    const primaryAsset = validDetected[0]
    const relatedKeys = verdict.relatedAssets?.length > 0
      ? verdict.relatedAssets
      : (RELATED[primaryAsset] ?? overviewList.filter(a => !validDetected.includes(a)).slice(0, 3))

    const relatedData = relatedKeys
      .map((key: string) => allOracleData.find(a => a.asset === key))
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      query,
      queryType,
      isMarketQuery: true,
      primaryAssets: verdictAssets,
      relatedAssets: relatedData,
      entropy,
      response: verdict,
      hasPro,
      updatedAt: Date.now(),
    })

  } catch (err) {
    console.error('Ask API error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}