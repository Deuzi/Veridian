'use client'
// src/app/page.tsx
import { useState, useRef, useEffect } from 'react'
import ResultCard from '@/components/ResultCard'
import SearchBox from '@/components/SearchBox'

export type ApiResult = {
  success: boolean
  query: string
  queryType: 'single' | 'comparison' | 'overview' | 'unknown'
  isMarketQuery: boolean
  primaryAssets: any[]
  relatedAssets: any[]
  entropy: any
  response: any
  updatedAt: number
}

const QUICK_PICKS = [
  { label: 'BTC', pro: false },
  { label: 'ETH vs SOL', pro: false },
  { label: 'Market overview', pro: false },
  { label: 'Gold', pro: true },
  { label: 'TSLA after hours', pro: true },
  { label: 'Is EUR/USD stable?', pro: true },
  { label: 'Oil price now', pro: true },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<ApiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSearch(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (err: any) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleQuickPick(label: string) {
    setQuery(label)
    handleSearch(label)
  }

  function handleBack() {
    setResult(null)
    setError('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const showHero = !result && !loading && !error

  return (
    <main style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <nav style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div
          onClick={handleBack}
          style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', cursor: 'pointer' }}
        >
          Veridian<span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
            borderRadius: 20, border: '1px solid rgba(48,209,88,0.18)',
            background: 'rgba(48,209,88,0.06)', fontSize: 11, color: '#30d158',
          }}>
            <div className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#30d158' }} />
            94 publishers live
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
            borderRadius: 20, border: '1px solid rgba(191,90,242,0.25)',
            background: 'rgba(191,90,242,0.08)', fontSize: 11, color: '#bf5af2',
          }}>
            <div className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#bf5af2', animationDelay: '0.5s' }} />
            Pyth Pro
          </div>
        </div>
      </nav>

      {/* HERO STATE */}
      {showHero && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '64px 40px 60px', textAlign: 'center',
        }}>
          {/* Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            border: '1px solid rgba(48,209,88,0.2)', background: 'rgba(48,209,88,0.06)',
            fontSize: 11, color: '#30d158', letterSpacing: '0.05em', fontWeight: 500,
            marginBottom: 24,
          }}>
            <div className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#30d158' }} />
            Live · Pyth Network · 400ms updates
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 58px)', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1.04, marginBottom: 14,
          }}>
            Ask the market<br />
            <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>anything.</span>
          </h1>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.55)', fontWeight: 300,
            marginBottom: 36, letterSpacing: '-0.01em', lineHeight: 1.6, maxWidth: 420,
          }}>
            Type any asset, question, or comparison.<br />
            Get live Pyth oracle intelligence in seconds.
          </p>

          {/* Search */}
          <div style={{ width: '100%', maxWidth: 580, marginBottom: 20 }}>
            <SearchBox
              ref={inputRef}
              value={query}
              onChange={setQuery}
              onSearch={handleSearch}
              loading={loading}
            />
          </div>

          {/* Quick picks */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 580 }}>
            {QUICK_PICKS.map(p => (
              <button
                key={p.label}
                onClick={() => handleQuickPick(p.label)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 400,
                  cursor: 'pointer', fontFamily: 'inherit', background: 'transparent',
                  border: p.pro ? '1px solid rgba(191,90,242,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  color: p.pro ? 'rgba(191,90,242,0.7)' : 'rgba(255,255,255,0.55)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = p.pro ? '#bf5af2' : '#fff'
                  e.currentTarget.style.borderColor = p.pro ? 'rgba(191,90,242,0.4)' : 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.background = p.pro ? 'rgba(191,90,242,0.06)' : 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = p.pro ? 'rgba(191,90,242,0.7)' : 'rgba(255,255,255,0.55)'
                  e.currentTarget.style.borderColor = p.pro ? 'rgba(191,90,242,0.2)' : 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {p.pro ? '★ ' : ''}{p.label}
              </button>
            ))}
          </div>

          {/* Footnote */}
          <p style={{ marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.02em' }}>
            Powered by Pyth Price Feeds · Pyth Entropy · Pyth Pro · Groq AI
          </p>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          padding: '60px 40px',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            borderTop: '2px solid #30d158',
          }} className="spin" />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.01em' }}>
            Asking Pyth oracle network...
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: 16,
        }}>
          <div style={{ fontSize: 14, color: 'rgba(255,69,58,0.8)', fontWeight: 300 }}>{error}</div>
          <button
            onClick={handleBack}
            style={{
              padding: '8px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* RESULT STATE */}
      {result && !loading && (
        <div className="fade-up">
          <ResultCard
            result={result}
            originalQuery={query}
            onBack={handleBack}
            onRelatedSearch={handleQuickPick}
          />
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '14px 28px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: 'rgba(255,255,255,0.28)',
      }}>
        <div>Veridian · Pyth Playground Hackathon 2025</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Built on Pyth Network</span>
          <span>Apache 2.0</span>
        </div>
      </footer>
    </main>
  )
}
