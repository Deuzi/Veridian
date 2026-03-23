// src/lib/groq.ts
import { OracleData } from './pyth'
import { EntropyBaseline } from './entropy'
import { KEYWORD_MAP } from './config'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export type QueryType = 'single' | 'comparison' | 'overview' | 'unknown'

export interface ParsedIntent {
  type: QueryType
  assets: string[]       // detected asset keys e.g. ['BTC'] or ['ETH','SOL']
  isMarketQuery: boolean
  originalQuery: string
}

export interface OracleVerdict {
  type: QueryType
  isMarketQuery: boolean
  verdict: string         // AI-written HTML verdict
  verdictTag: string      // badge text
  shareText: string       // ready to post to X
  relatedAssets: string[] // suggested follow-up assets
  notMarketReason?: string // if not market query
}

// Detect assets from query text using keyword map
export function detectAssets(query: string): string[] {
  const q = query.toLowerCase()
  const found: string[] = []
  const seen = new Set<string>()

  // Sort by length descending so multi-word keywords match first
  const sorted = Object.entries(KEYWORD_MAP).sort((a, b) => b[0].length - a[0].length)

  for (const [kw, asset] of sorted) {
    if (q.includes(kw) && !seen.has(asset)) {
      found.push(asset)
      seen.add(asset)
    }
  }
  return found
}

// Check if query is market-related at all
function isMarketRelated(query: string): boolean {
  const q = query.toLowerCase()
  const marketKeywords = [
    'price', 'market', 'crypto', 'stock', 'forex', 'gold', 'oil', 'silver',
    'buy', 'sell', 'trade', 'invest', 'portfolio', 'asset', 'fund',
    'dollar', 'currency', 'exchange', 'rate', 'value', 'worth',
    'pump', 'dump', 'bull', 'bear', 'dip', 'rally', 'crash',
    'oracle', 'pyth', 'defi', 'blockchain', 'token', 'coin',
    'happening', 'market', 'overview', 'stable', 'volatile',
    ...Object.keys(KEYWORD_MAP),
  ]
  return marketKeywords.some(kw => q.includes(kw))
}

// Build Groq prompt based on query type and oracle data
function buildPrompt(
  query: string,
  type: QueryType,
  assets: OracleData[],
  entropy: EntropyBaseline
): { system: string; user: string } {
  const assetSummary = assets.map(a =>
    `${a.asset} (${a.name}): price=${a.priceFormatted}, confidence=${a.confidenceFormatted}, certainty=${a.certaintyScore}/100, publishers=${a.publisherConsensus}/94, deviation=${a.deviation}σ, rating=${a.rating}, isPro=${a.isPro}`
  ).join('\n')

  const system = `You are Veridian — a market oracle intelligence layer built on Pyth Network.

Your job: analyse live Pyth oracle data and return a JSON response with a verdict, share text, and related asset suggestions.

PYTH CONTEXT:
- Pyth Network has 94 independent publishers providing prices every 400ms
- Confidence interval = how much publishers agree. Tight = reliable. Wide = unreliable.
- Deviation = how far current confidence is from the 30-day baseline in standard deviations
- Certainty score 0-100: >=70 EXECUTE, 50-69 WAIT, <50 ABORT
- Pyth Pro feeds: equities (SPX, TSLA, NVDA, AAPL), forex (EUR_USD, GBP_USD, USD_JPY), commodities (XAU_USD, XAG_USD, WTI_USD)
- Pyth Entropy: provides provably random baseline for anomaly detection

ENTROPY BASELINE NOW:
- Global deviation: ${entropy.globalDeviation}σ
- Market mood: ${entropy.moodScore}/100
- Macro alert: ${entropy.macroAlertActive}
- Alert assets: ${entropy.alertAssets.join(', ') || 'none'}
- Entropy seed: ${entropy.seed}

LIVE ASSET DATA:
${assetSummary}

RULES:
- Never give buy/sell signals. Talk about DATA QUALITY and ORACLE CONDITIONS only.
- Always mention specific numbers from the live data.
- For Pro assets, mention "Pyth Pro" — it's special.
- For comparison queries, clearly state which asset has cleaner oracle data.
- Keep verdict to 3-4 sentences. Dense with insight. No fluff.
- Share text must be under 280 characters and mention @PythNetwork.

Return ONLY this JSON (no markdown, no code blocks):
{
  "verdict": "HTML string with <strong> tags for emphasis. 3-4 sentences. Mention real numbers.",
  "verdictTag": "Short badge text like ORACLE VERDICT or PRO FEED or MACRO ALERT or COMPARISON",
  "shareText": "Ready to post to X. Under 280 chars. Include @PythNetwork.",
  "relatedAssets": ["ASSET_KEY1", "ASSET_KEY2", "ASSET_KEY3"]
}`

  const user = `User query: "${query}"
Query type: ${type}
Assets detected: ${assets.map(a => a.asset).join(', ') || 'none — market overview'}
Time: ${new Date().toUTCString()}`

  return { system, user }
}

// Main function: parse intent, fetch data, generate verdict
export async function generateVerdict(
  query: string,
  assets: OracleData[],
  entropy: EntropyBaseline,
  type: QueryType
): Promise<OracleVerdict> {

  const { system, user } = buildPrompt(query, type, assets, entropy)

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Groq error ${res.status}`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      type,
      isMarketQuery: true,
      verdict: parsed.verdict,
      verdictTag: parsed.verdictTag,
      shareText: parsed.shareText,
      relatedAssets: parsed.relatedAssets ?? [],
    }
  } catch (err) {
    console.error('Groq error:', err)
    return fallbackVerdict(query, type, assets, entropy)
  }
}

// Fallback when Groq is unavailable
function fallbackVerdict(
  query: string,
  type: QueryType,
  assets: OracleData[],
  entropy: EntropyBaseline
): OracleVerdict {
  const a = assets[0]
  const b = assets[1]

  let verdict = ''
  let verdictTag = 'ORACLE VERDICT'
  let shareText = ''

  if (type === 'comparison' && a && b) {
    const winner = a.certaintyScore >= b.certaintyScore ? a : b
    const loser = winner === a ? b : a
    verdict = `<strong>${winner.name}</strong> has significantly cleaner oracle data than ${loser.name} right now. ${winner.name}: ${winner.publisherConsensus}/94 publishers, confidence ${winner.confidenceFormatted} — conditions ${winner.rating}. ${loser.name}: ${loser.publisherConsensus}/94 publishers, confidence ${loser.confidenceFormatted} — conditions ${loser.rating}. If you need to act on one of these assets, <strong>${winner.name} oracle conditions are healthier right now.</strong>`
    verdictTag = 'COMPARISON VERDICT'
    shareText = `${winner.asset} vs ${loser.asset} oracle from Veridian: ${winner.asset} ${winner.certaintyScore}/100 certainty vs ${loser.asset} ${loser.certaintyScore}/100. ${winner.asset} oracle is cleaner right now. Powered by @PythNetwork`
  } else if (type === 'overview') {
    const stressed = assets.filter(x => x.certaintyScore < 50).map(x => x.asset)
    const clean = assets.filter(x => x.certaintyScore >= 70).map(x => x.asset)
    verdict = `Pyth Entropy is detecting a <strong>${entropy.globalDeviation}σ global deviation</strong> across all monitored feeds. ${stressed.length ? `<strong>${stressed.join(', ')}</strong> showing critical oracle stress.` : ''} ${clean.length ? `<strong>${clean.join(', ')}</strong> are clean and reliable.` : ''} Market mood score: <strong>${entropy.moodScore}/100</strong>. ${entropy.macroAlertActive ? '<strong>Macro alert active</strong> — multiple asset classes diverging simultaneously.' : 'No macro alert active currently.'}`
    verdictTag = entropy.macroAlertActive ? 'MACRO ALERT' : 'MARKET OVERVIEW'
    shareText = `Market oracle overview from Veridian: Mood ${entropy.moodScore}/100. Global deviation ${entropy.globalDeviation}σ. ${entropy.macroAlertActive ? 'MACRO ALERT ACTIVE.' : ''} Powered by @PythNetwork`
  } else if (a) {
    verdict = `<strong>${a.name}</strong> is priced at ${a.priceFormatted} right now via ${a.isPro ? 'Pyth Pro' : 'Pyth Network'} — ${a.publisherConsensus} of 94 publishers in consensus. Confidence interval: <strong>${a.confidenceFormatted}</strong> at ${a.deviation}σ ${a.deviation > 2 ? 'above' : 'from'} the 30-day baseline. Oracle conditions: <strong>${a.rating}</strong>. ${a.rating === 'ABORT' ? 'This price is not reliable enough to act on right now.' : a.rating === 'WAIT' ? 'Exercise caution — publisher spread is elevated.' : 'Data is clean and reliable.'}`
    verdictTag = a.isPro ? 'PRO FEED VERDICT' : 'ORACLE VERDICT'
    shareText = `${a.asset} oracle from Veridian: ${a.priceFormatted} · ${a.publisherConsensus}/94 publishers · ${a.confidenceFormatted} confidence · ${a.deviation}σ deviation. Conditions: ${a.rating}. Powered by @PythNetwork`
  }

  const allAssets = ['BTC', 'ETH', 'SOL', 'XAU_USD', 'SPX', 'EUR_USD', 'WTI_USD']
  const related = allAssets
    .filter(k => !assets.find(x => x.asset === k))
    .slice(0, 3)

  return {
    type,
    isMarketQuery: true,
    verdict,
    verdictTag,
    shareText,
    relatedAssets: related,
  }
}

// Check intent and return a "not market" response
export function notMarketResponse(query: string): OracleVerdict {
  return {
    type: 'unknown',
    isMarketQuery: false,
    verdict: '',
    verdictTag: '',
    shareText: '',
    relatedAssets: [],
    notMarketReason: `Veridian only understands markets. Try asking about <strong>BTC, Gold, EUR/USD, TSLA, Oil</strong> — or type "market overview" to see everything at once.`,
  }
}

export { isMarketRelated }
