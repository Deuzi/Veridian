// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { detectAssets, generateVerdict, isMarketRelated, notMarketResponse, QueryType } from '@/lib/groq'
import { getMarketSnapshot } from '@/lib/pyth'
import { buildEntropyBaseline } from '@/lib/entropy'

// Core crypto — always free, no Pro key needed
const CRYPTO_ASSETS = ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK', 'BNB']

// Pro assets — need Pyth Pro key
const PRO_ASSETS = new Set(['SPX', 'TSLA', 'NVDA', 'AAPL', 'EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'XAG_USD', 'WTI_USD'])

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
    const refreshOnly: boolean = body.refreshOnly ?? false

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    const hasPro = !!process.env.PYTH_PRO_API_KEY

    // Step 1 — detect assets
    const detectedAssets = detectAssets(query)

    // Filter pro assets if no key
    const validDetected = hasPro
      ? detectedAssets
      : detectedAssets.filter(a => !PRO_ASSETS.has(a))

    // Determine query type
    const isOverview = validDetected.length === 0
    const isComparison = validDetected.length >= 2
    let queryType: QueryType = isOverview ? 'overview' : isComparison ? 'comparison' : 'single'

    // Step 2 — build fetch list
    // Always include some crypto context even for single asset queries
    const overviewList = hasPro
      ? ['BTC', 'ETH', 'SOL', 'AVAX', 'XAU_USD', 'WTI_USD', 'EUR_USD', 'SPX']
      : ['BTC', 'ETH', 'SOL', 'AVAX']

    let toFetch: string[]
    if (isOverview) {
      toFetch = overviewList
    } else {
      // Fetch detected + core crypto for context
      toFetch = Array.from(new Set([...validDetected, ...CRYPTO_ASSETS.slice(0, 2)]))
    }

    // Step 3 — fetch live Pyth data
    // Never crash here — always try, handle gracefully
    let allOracleData = await getMarketSnapshot(toFetch)

    // If Pyth returned nothing, try crypto-only as fallback
    if (allOracleData.length === 0) {
      console.warn('Pyth returned no data for:', toFetch, '— trying crypto fallback')
      allOracleData = await getMarketSnapshot(['BTC', 'ETH', 'SOL'])
    }

    // Step 4 — entropy baseline (works even with minimal data)
    const entropy = buildEntropyBaseline(allOracleData)

    // Step 5 — for refresh requests, skip AI and return just prices
    if (refreshOnly) {
      const relevantRefresh = isOverview
        ? allOracleData
        : allOracleData.filter(a => validDetected.includes(a.asset))
      const relatedRefresh = (RELATED[validDetected[0]] ?? [])
        .map(k => allOracleData.find(a => a.asset === k))
        .filter(Boolean)

      return NextResponse.json({
        success: true,
        primaryAssets: relevantRefresh.length > 0 ? relevantRefresh : allOracleData,
        relatedAssets: relatedRefresh,
        entropy,
        updatedAt: Date.now(),
      })
    }

    // Step 6 — check if market related
    if (!isMarketRelated(query)) {
      return NextResponse.json({
        success: true,
        query,
        queryType: 'unknown',
        isMarketQuery: false,
        primaryAssets: allOracleData.slice(0, 4),
        relatedAssets: [],
        entropy,
        response: notMarketResponse(query),
        updatedAt: Date.now(),
      })
    }

    // Step 7 — relevant assets for verdict
    const relevantAssets = isOverview
      ? allOracleData
      : allOracleData.filter(a => validDetected.includes(a.asset))

    // Always pass something to Groq even if specific asset wasn't found
    const verdictAssets = relevantAssets.length > 0
      ? relevantAssets
      : allOracleData.slice(0, 3)

    // Step 8 — generate AI verdict
    // This never throws — it has a fallback built in
    const verdict = await generateVerdict(query, verdictAssets, entropy, queryType)

    // Step 9 — related suggestions
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
    // Never return a blank error — always give context
    return NextResponse.json(
      { error: 'Could not reach oracle network. Please try again in a moment.' },
      { status: 500 }
    )
  }
}