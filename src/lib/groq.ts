// src/lib/groq.ts
import { OracleData } from './pyth'
import { EntropyBaseline } from './entropy'
import { KEYWORD_MAP } from './config'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export type QueryType = 'single' | 'comparison' | 'overview' | 'unknown'

export interface OracleVerdict {
  type: QueryType
  isMarketQuery: boolean
  verdict: string
  verdictTag: string
  shareText: string
  relatedAssets: string[]
  notMarketReason?: string
  newsInsight?: string
}

// Detect assets from query
export function detectAssets(query: string): string[] {
  const q = query.toLowerCase()
  const found: string[] = []
  const seen = new Set<string>()
  const sorted = Object.entries(KEYWORD_MAP).sort((a, b) => b[0].length - a[0].length)
  for (const [kw, asset] of sorted) {
    if (q.includes(kw) && !seen.has(asset)) {
      found.push(asset)
      seen.add(asset)
    }
  }
  return found
}

// Much more permissive — if Groq says it's financial, we handle it
export function isMarketRelated(query: string): boolean {
  const q = query.toLowerCase()

  // Explicit non-market topics — short circuit
  const nonMarket = [
    'weather', 'recipe', 'cook', 'sport', 'football', 'soccer', 'basketball',
    'movie', 'music', 'song', 'actor', 'actress', 'game', 'video game',
    'joke', 'poem', 'story', 'history', 'science', 'math', 'homework',
    'health', 'doctor', 'medicine', 'fitness', 'diet',
  ]
  if (nonMarket.some(k => q.includes(k))) return false

  // Everything else gets a chance — Groq will handle it
  return true
}

export async function generateVerdict(
  query: string,
  assets: OracleData[],
  entropy: EntropyBaseline,
  type: QueryType
): Promise<OracleVerdict> {

  // Keep asset summary concise to avoid token overflow
  const assetSummary = assets.slice(0, 6).map(a =>
    `${a.asset}: price=${a.priceFormatted}, certainty=${a.certaintyScore}/100, publishers=${a.publisherConsensus}/94, conf=${a.confidenceFormatted}, rating=${a.rating}`
  ).join('\n')

  const system = `You are Veridian, a financial oracle intelligence powered by Pyth Network.

  You answer ANY financial market question using live Pyth oracle data.

  LIVE PYTH DATA RIGHT NOW:
  ${assetSummary}

  ENTROPY BASELINE:
  - Market mood: ${entropy.moodScore}/100
  - Global deviation: ${entropy.globalDeviation}σ  
  - Macro alert: ${entropy.macroAlertActive}

  RULES:
  - Always use the live Pyth numbers (price, certainty, publishers, EMA, momentum)
  - Talk about oracle quality: how trustworthy the data is right now (EXECUTE/WAIT/ABORT)
  - Mention if price is above or below EMA and the momentum
  - Never give direct buy/sell advice. Focus on data quality and market conditions.
  - For every response, include a short "Market Pulse" insight.
  - Keep verdict to 3-4 dense sentences with <strong> tags for key numbers.

  Return ONLY this JSON:
  {
    "isMarketQuery": true,
    "verdict": "3-4 sentences with strong insights",
    "verdictTag": "ORACLE VERDICT or MARKET OVERVIEW or PRO FEED or COMPARISON or PYTH INSIGHT",
    "shareText": "Under 280 chars, mention @PythNetwork",
    "relatedAssets": ["ASSET1", "ASSET2"],
    "newsInsight": "One short powerful sentence about current market pulse"
  }`;

  const user = `Query: "${query}"
Type: ${type}
Time: ${new Date().toUTCString()}`

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Groq API error:', res.status, errText)
      throw new Error(`Groq error ${res.status}`)
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const clean = text.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      // If JSON parse fails, Groq returned something unexpected — use fallback
      return fallbackVerdict(query, type, assets, entropy)
    }

    // If Groq says not market related
    if (parsed.isMarketQuery === false) {
      return {
        type: 'unknown',
        isMarketQuery: false,
        verdict: '',
        verdictTag: '',
        shareText: '',
        relatedAssets: [],
        notMarketReason: `Veridian only understands financial markets. Try asking about <strong>BTC, Gold, ETH vs SOL, EUR/USD, Oil</strong> — or type <strong>"market overview"</strong> to see all live prices.`,
      }
    }

    return {
    type,
    isMarketQuery: true,
    verdict: parsed.verdict ?? '',
    verdictTag: parsed.verdictTag ?? 'ORACLE VERDICT',
    shareText: parsed.shareText ?? '',
    relatedAssets: Array.isArray(parsed.relatedAssets) ? parsed.relatedAssets : [],
    newsInsight: parsed.newsInsight ?? 'Live Pyth oracle conditions updated.',
  }

  } catch (err) {
    console.error('Groq error:', err)
    return fallbackVerdict(query, type, assets, entropy)
  }
}

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
    verdict = `<strong>${winner.name}</strong> has cleaner oracle data than ${loser.name} right now. ${winner.name}: ${winner.publisherConsensus}/94 publishers in consensus, confidence ${winner.confidenceFormatted} — ${winner.rating}. ${loser.name}: ${loser.publisherConsensus}/94 publishers, ${loser.confidenceFormatted} — ${loser.rating}.`
    verdictTag = 'COMPARISON VERDICT'
    shareText = `${winner.asset} vs ${loser.asset} via Veridian: ${winner.asset} oracle cleaner right now (${winner.certaintyScore}/100 vs ${loser.certaintyScore}/100). Powered by @PythNetwork`
  } else if (type === 'overview') {
    const critical = assets.filter(x => x.certaintyScore < 50).map(x => x.asset)
    const clean = assets.filter(x => x.certaintyScore >= 70).map(x => x.asset)
    verdict = `Market mood score: <strong>${entropy.moodScore}/100</strong>. Global Pyth deviation: <strong>${entropy.globalDeviation}σ</strong>. ${clean.length ? `Clean feeds: <strong>${clean.join(', ')}</strong>.` : ''} ${critical.length ? `Critical: <strong>${critical.join(', ')}</strong>.` : ''} ${entropy.macroAlertActive ? '<strong>Macro alert active</strong> — multiple asset classes diverging.' : 'No macro stress detected.'}`
    verdictTag = entropy.macroAlertActive ? 'MACRO ALERT' : 'MARKET OVERVIEW'
    shareText = `Live market overview via Veridian: Mood ${entropy.moodScore}/100, deviation ${entropy.globalDeviation}σ. ${entropy.macroAlertActive ? 'MACRO ALERT ACTIVE.' : ''} Powered by @PythNetwork`
  } else if (a) {
    verdict = `<strong>${a.name}</strong> is at ${a.priceFormatted} via ${a.isPro ? 'Pyth Pro' : 'Pyth Network'}. ${a.publisherConsensus}/94 publishers in consensus — confidence ${a.confidenceFormatted} at ${a.deviation}σ from baseline. Oracle conditions: <strong>${a.rating}</strong>. ${a.rating === 'ABORT' ? 'Do not act on this price right now.' : a.rating === 'WAIT' ? 'Proceed with caution.' : 'Data is clean and reliable.'}`
    verdictTag = a.isPro ? 'PRO FEED VERDICT' : 'ORACLE VERDICT'
    shareText = `${a.asset} oracle via Veridian: ${a.priceFormatted} · ${a.publisherConsensus}/94 publishers · ${a.confidenceFormatted} · ${a.rating}. Powered by @PythNetwork`
  } else {
    verdict = `Live Pyth oracle data is being monitored across ${assets.length} assets. Market mood: <strong>${entropy.moodScore}/100</strong>. Global deviation: <strong>${entropy.globalDeviation}σ</strong>.`
    verdictTag = 'ORACLE VERDICT'
    shareText = `Live market intelligence via Veridian. Market mood: ${entropy.moodScore}/100. Powered by @PythNetwork`
  }

  const related = ['BTC', 'ETH', 'SOL', 'XAU_USD', 'EUR_USD']
    .filter(k => !assets.find(x => x.asset === k))
    .slice(0, 3)

  return { type, isMarketQuery: true, verdict, verdictTag, shareText, relatedAssets: related , newsInsight: "Live Pyth oracle conditions updated."}
}

export function notMarketResponse(query: string): OracleVerdict {
  return {
    type: 'unknown',
    isMarketQuery: false,
    verdict: '',
    verdictTag: '',
    shareText: '',
    relatedAssets: [],
    notMarketReason: `Veridian only understands financial markets. Try asking about <strong>BTC, Gold, ETH vs SOL, EUR/USD, Oil</strong> — or type <strong>"market overview"</strong> to see all live prices.`,
  }
}

