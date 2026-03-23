// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { detectAssets, generateVerdict, isMarketRelated, notMarketResponse, QueryType } from '@/lib/groq'
import { getOracleData, getMarketSnapshot } from '@/lib/pyth'
import { buildEntropyBaseline } from '@/lib/entropy'
import { ASSET_META } from '@/lib/config'

export const runtime = 'edge'

// Default market overview assets
const OVERVIEW_ASSETS = ['BTC', 'ETH', 'SOL', 'XAU_USD', 'SPX', 'EUR_USD', 'WTI_USD']

// Related asset suggestions per asset
const RELATED: Record<string, string[]> = {
  BTC:     ['ETH', 'SOL', 'XAU_USD'],
  ETH:     ['BTC', 'SOL', 'AVAX'],
  SOL:     ['ETH', 'BTC', 'AVAX'],
  AVAX:    ['SOL', 'ETH', 'LINK'],
  XAU_USD: ['WTI_USD', 'XAG_USD', 'BTC'],
  WTI_USD: ['XAU_USD', 'XAG_USD', 'SPX'],
  XAG_USD: ['XAU_USD', 'WTI_USD', 'SPX'],
  SPX:     ['TSLA', 'NVDA', 'AAPL'],
  TSLA:    ['NVDA', 'AAPL', 'SPX'],
  NVDA:    ['TSLA', 'AAPL', 'SPX'],
  AAPL:    ['TSLA', 'NVDA', 'SPX'],
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

    // Step 1 — check if query is market-related at all
    if (!isMarketRelated(query)) {
      return NextResponse.json({
        success: true,
        queryType: 'unknown',
        isMarketQuery: false,
        response: notMarketResponse(query),
        entropy: null,
        assets: [],
      })
    }

    // Step 2 — detect assets in query
    const detectedAssets = detectAssets(query)
    const isOverview = detectedAssets.length === 0
    const isComparison = detectedAssets.length >= 2

    let queryType: QueryType
    if (isOverview) queryType = 'overview'
    else if (isComparison) queryType = 'comparison'
    else queryType = 'single'

    // Step 3 — fetch live Pyth data
    let oracleAssets
    if (isOverview) {
      oracleAssets = await getMarketSnapshot(OVERVIEW_ASSETS)
    } else {
      // Fetch all detected + a couple extras for context
      const toFetch = [...new Set([...detectedAssets, ...OVERVIEW_ASSETS.slice(0, 3)])]
      oracleAssets = await getMarketSnapshot(toFetch)
    }

    if (oracleAssets.length === 0) {
      return NextResponse.json({ error: 'Could not fetch live data' }, { status: 503 })
    }

    // Step 4 — build entropy baseline
    const entropy = buildEntropyBaseline(oracleAssets)

    // Step 5 — filter to just the relevant assets for the verdict
    const relevantAssets = isOverview
      ? oracleAssets
      : oracleAssets.filter(a => detectedAssets.includes(a.asset))

    // Step 6 — generate AI verdict via Groq
    const verdict = await generateVerdict(query, relevantAssets, entropy, queryType)

    // Step 7 — build related suggestions
    const primaryAsset = detectedAssets[0]
    const relatedKeys = verdict.relatedAssets.length > 0
      ? verdict.relatedAssets
      : (RELATED[primaryAsset] ?? OVERVIEW_ASSETS.filter(a => !detectedAssets.includes(a)).slice(0, 3))

    const relatedData = relatedKeys
      .map(key => oracleAssets.find(a => a.asset === key))
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      query,
      queryType,
      isMarketQuery: true,
      primaryAssets: relevantAssets,
      relatedAssets: relatedData,
      entropy,
      response: verdict,
      updatedAt: Date.now(),
    })

  } catch (err) {
    console.error('Ask API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
