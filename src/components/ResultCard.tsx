'use client'
// src/components/ResultCard.tsx
import { useState, useEffect } from 'react'
import { ApiResult } from '@/app/page'
import SearchBox from './SearchBox'
import { ASSET_META } from '@/lib/config'

interface Props {
  result: ApiResult
  originalQuery: string
  onBack: () => void
  onRelatedSearch: (q: string) => void
}

function scoreColor(score: number) {
  if (score >= 70) return '#30d158'
  if (score >= 50) return '#ff9f0a'
  return '#ff453a'
}

function ratingBg(rating: string) {
  if (rating === 'EXECUTE') return 'rgba(48,209,88,0.1)'
  if (rating === 'WAIT') return 'rgba(255,159,10,0.1)'
  return 'rgba(255,69,58,0.1)'
}
function fmtEMAPrice(price: number, assetKey: string) {
  // Use the same logic as fmtPrice but fallback safely to BTC decimals if unknown
  const meta = ASSET_META[assetKey] || ASSET_META['BTC'];
  const d = meta?.decimals ?? 2;

  if (price >= 1000) return '$' + price.toLocaleString('en', { maximumFractionDigits: 0 });
  if (price >= 1) return '$' + price.toFixed(d > 2 ? 2 : d);
  return '$' + price.toFixed(d);
}

export default function ResultCard({ result, originalQuery, onBack, onRelatedSearch }: Props) {
  const [searchVal, setSearchVal] = useState(originalQuery)
  const [copied, setCopied] = useState(false)
  const [seq, setSeq] = useState(48291)

  useEffect(() => {
    const i = setInterval(() => setSeq(s => s + 1), 1500)
    return () => clearInterval(i)
  }, [])

  const { response, primaryAssets, relatedAssets, entropy, queryType } = result
  const primary = primaryAssets?.[0]
  const secondary = primaryAssets?.[1]
  const isComparison = queryType === 'comparison'
  const isOverview = queryType === 'overview'
  const isUnknown = !result.isMarketQuery

  function copyShare() {
    navigator.clipboard.writeText(response?.shareText ?? '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Not market query
  if (isUnknown) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={backBtnStyle}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 7H2M7 2L2 7l5 5" /></svg>
            Back
          </button>
          <div style={{ flex: 1, maxWidth: 440 }}>
            <SearchBox value={searchVal} onChange={setSearchVal} onSearch={q => { setSearchVal(q); onRelatedSearch(q) }} compact />
          </div>
        </div>
        <div style={{
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '28px 28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>◎</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Veridian only knows markets.</div>
          <div
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 300, lineHeight: 1.65 }}
            dangerouslySetInnerHTML={{ __html: response?.notMarketReason ?? '' }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {['BTC', 'Gold', 'ETH vs SOL', 'Market overview', 'EUR/USD'].map(s => (
              <button key={s} onClick={() => onRelatedSearch(s)} style={quickStyle}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={backBtnStyle}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 7H2M7 2L2 7l5 5" /></svg>
          Back
        </button>
        <div style={{ flex: 1, maxWidth: 520 }}>
          <SearchBox
            value={searchVal}
            onChange={setSearchVal}
            onSearch={q => { setSearchVal(q); onRelatedSearch(q) }}
            compact
          />
        </div>
      </div>

      {/* COMPARISON LAYOUT */}
      {isComparison && primary && secondary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[primary, secondary].map((asset, i) => (
              <AssetPanel key={asset.asset} asset={asset} isWinner={i === 0 ? primary.certaintyScore >= secondary.certaintyScore : secondary.certaintyScore > primary.certaintyScore} />
            ))}
          </div>
          <VerdictPanel response={response} entropy={entropy} seq={seq} />
          <SharePanel response={response} copied={copied} onCopy={copyShare} />
          {relatedAssets?.length > 0 && <RelatedRow assets={relatedAssets} onSearch={onRelatedSearch} />}
        </div>
      )}

      {/* OVERVIEW LAYOUT */}
      {isOverview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OverviewGrid assets={primaryAssets} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <VerdictPanel response={response} entropy={entropy} seq={seq} />
            <MoodPanel entropy={entropy} seq={seq} />
          </div>
          <SharePanel response={response} copied={copied} onCopy={copyShare} />
        </div>
      )}

      {/* SINGLE ASSET LAYOUT */}
      {!isComparison && !isOverview && primary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MainAssetCard asset={primary} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <VerdictPanel response={response} entropy={entropy} seq={seq} />
            <MoodPanel entropy={entropy} seq={seq} />
          </div>
          <SharePanel response={response} copied={copied} onCopy={copyShare} />
          {relatedAssets?.length > 0 && <RelatedRow assets={relatedAssets} onSearch={onRelatedSearch} />}
        </div>
      )}
    </div>
  )
}

function MainAssetCard({ asset }: { asset: any }) {
  const color = scoreColor(asset.certaintyScore)

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {/* Real Logo Image */}
            <img 
              src={asset.icon} 
              alt={asset.name}
              style={{ 
                width: 42, 
                height: 42, 
                borderRadius: '50%', 
                objectFit: 'contain',
                background: asset.iconBg,
                padding: '4px'
              }}
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = 'https://cryptologos.cc/logos/question-mark-logo.png';
              }}
            />
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 7 }}>
                {asset.name}
                {asset.isPro && (
                  <span style={{ 
                    fontSize: 9, 
                    padding: '2px 6px', 
                    borderRadius: 3, 
                    background: 'rgba(191,90,242,0.1)', 
                    color: '#bf5af2', 
                    border: '1px solid rgba(191,90,242,0.2)', 
                    letterSpacing: '0.06em', 
                    fontWeight: 600 
                  }}>
                    PRO
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 1, letterSpacing: '0.02em' }}>
                {asset.symbol} · {asset.publisherConsensus}/94 publishers
              </div>
            </div>
          </div>

          {/* EMA + Momentum */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <div>
              Spot: <span style={{ fontWeight: 600, color }}>{asset.priceFormatted}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)' }}>•</div>
            <div>
              EMA: <span style={{ fontWeight: 500 }}>
                {fmtEMAPrice(asset.emaPrice || 0, asset.asset || 'BTC')}
              </span>
            </div>
            
            <div style={{ 
              padding: '2px 8px', 
              borderRadius: 6, 
              fontSize: 12, 
              fontWeight: 600,
              backgroundColor: asset.momentumColor + '20',
              color: asset.momentumColor,
              marginLeft: 4
            }}>
              {asset.momentum}
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 300, lineHeight: 1.6, marginTop: 12 }}>
            {asset.certaintyScore >= 70
              ? `Strong publisher consensus at ${asset.publisherConsensus}/94. Tight confidence ${asset.confidenceFormatted}.`
              : asset.certaintyScore >= 50
              ? `Moderate divergence detected. ${asset.confidenceFormatted} confidence — ${asset.deviation}σ from baseline.`
              : `Significant publisher disagreement. Exercise caution with this feed.`
            }
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: color, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
            {asset.priceFormatted}
          </div>
          <div style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, display: 'inline-block', background: ratingBg(asset.rating), color: asset.ratingColor, fontWeight: 600, letterSpacing: '0.04em' }}>
            {asset.rating}
          </div>
        </div>
      </div>

      {/* Bottom stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
        {[
          { label: 'CONFIDENCE', val: asset.confidenceFormatted, color: color },
          { label: 'PUBLISHERS', val: `${asset.publisherConsensus}/94`, color: '#fff' },
          { label: 'DEVIATION',  val: `${asset.deviation}σ`, color: asset.deviation >= 2.5 ? '#ff453a' : asset.deviation >= 1.5 ? '#ff9f0a' : '#30d158' },
          { label: 'MOMENTUM',   val: asset.momentum, color: asset.momentumColor },
        ].map(m => (
          <div key={m.label} style={{ background: '#0a0a0a', padding: '13px 16px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: m.color, marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
              {m.val}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
function AssetPanel({ asset, isWinner }: { asset: any; isWinner: boolean }) {
  const color = scoreColor(asset.certaintyScore)
  return (
    <div style={{
      background: '#0a0a0a', borderRadius: 14, overflow: 'hidden',
      border: isWinner ? '1px solid rgba(48,209,88,0.25)' : '1px solid rgba(255,255,255,0.06)',
    }}>
      {isWinner && (
        <div style={{ padding: '5px 14px', background: 'rgba(48,209,88,0.08)', borderBottom: '1px solid rgba(48,209,88,0.15)', fontSize: 10, color: '#30d158', letterSpacing: '0.08em', fontWeight: 600 }}>
          CLEANER ORACLE DATA
        </div>
      )}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: asset.iconBg, color: asset.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
            {asset.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{asset.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{asset.symbol}</div>
          </div>
        </div>
        <div style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, letterSpacing: '-0.04em', color: color, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
          {asset.priceFormatted}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { k: 'CERTAINTY', v: `${asset.certaintyScore}/100`, c: color },
            { k: 'CONDITIONS', v: asset.rating, c: asset.ratingColor },
            { k: 'PUBLISHERS', v: `${asset.publisherConsensus}/94`, c: '#fff' },
            { k: 'CONFIDENCE', v: asset.confidenceFormatted, c: color },
          ].map(m => (
            <div key={m.k} style={{ background: '#111', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: m.c, marginBottom: 2 }}>{m.v}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.07em' }}>{m.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OverviewGrid({ assets }: { assets: any[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
      {assets.map(asset => {
        const color = scoreColor(asset.certaintyScore)
        return (
          <div key={asset.asset} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: asset.iconBg, color: asset.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                  {asset.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{asset.asset.replace('_', '/')}</div>
              </div>
              {asset.isPro && <span style={{ fontSize: 8, color: '#bf5af2' }}>★</span>}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
              {asset.certaintyScore}
            </div>
            <div style={{ fontSize: 10, color: asset.ratingColor, fontWeight: 600, letterSpacing: '0.05em' }}>
              {asset.rating}
            </div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${asset.certaintyScore}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VerdictPanel({ response, entropy, seq }: { response: any; entropy: any; seq: number }) {
  const isPro = response?.verdictTag?.includes('PRO')
  const isMacro = response?.verdictTag?.includes('MACRO')
  const tagBg = isPro ? 'rgba(191,90,242,0.1)' : isMacro ? 'rgba(10,132,255,0.1)' : 'rgba(255,255,255,0.07)'
  const tagColor = isPro ? '#bf5af2' : isMacro ? '#0a84ff' : 'rgba(255,255,255,0.55)'
  const tagBorder = isPro ? 'rgba(191,90,242,0.2)' : isMacro ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.1)'

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 10, padding: '3px 9px', borderRadius: 4, fontWeight: 600, letterSpacing: '0.08em', background: tagBg, color: tagColor, border: `1px solid ${tagBorder}` }}>
          {response?.verdictTag ?? 'ORACLE VERDICT'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
          Generated live · Groq + Pyth{entropy?.macroAlertActive ? ' · Macro Alert' : ''}
        </div>
      </div>
      <div
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 300, lineHeight: 1.72, letterSpacing: '-0.01em' }}
        dangerouslySetInnerHTML={{ __html: response?.verdict ?? 'Generating verdict...' }}
      />
    </div>
  )
}

function MoodPanel({ entropy, seq }: { entropy: any; seq: number }) {
  if (!entropy) return null
  const moodColor = entropy.moodColor ?? '#ff9f0a'
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 8 }}>MARKET MOOD SCORE</div>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', color: moodColor, lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
          {entropy.moodScore}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 300, lineHeight: 1.5, marginBottom: 8 }}>
          {entropy.moodLabel}
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${entropy.moodScore}%`, background: moodColor, transition: 'width 1s' }} />
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 2 }}>PYTH ENTROPY BASELINE</div>
        {[
          { label: 'Global deviation', val: `${entropy.globalDeviation}σ`, color: entropy.globalDeviation >= 2.5 ? '#ff453a' : '#ff9f0a' },
          { label: 'Sequence', val: `#${seq.toLocaleString()}`, color: '#fff' },
          { label: 'Macro alert', val: entropy.macroAlertActive ? 'Active' : 'None', color: entropy.macroAlertActive ? '#0a84ff' : '#30d158' },
          { label: 'Seed', val: entropy.seed, color: 'rgba(255,255,255,0.28)' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{r.label}</div>
            <div style={{ fontSize: r.label === 'Seed' ? 10 : 11, fontWeight: 500, color: r.color, fontVariantNumeric: 'tabular-nums' }}>{r.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SharePanel({ response, copied, onCopy }: { response: any; copied: boolean; onCopy: () => void }) {
  if (!response?.shareText) return null
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 5 }}>SHARE TO X</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 300, lineHeight: 1.55, letterSpacing: '-0.01em' }}>
          {response.shareText}
        </div>
      </div>
      <button
        onClick={onCopy}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 9,
          background: copied ? 'rgba(48,209,88,0.15)' : '#fff',
          color: copied ? '#30d158' : '#000',
          border: copied ? '1px solid rgba(48,209,88,0.3)' : 'none',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'all 0.2s',
        }}
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#30d158" strokeWidth="2" strokeLinecap="round"><path d="M2 7l4 4 6-7" /></svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            Share
          </>
        )}
      </button>
    </div>
  )
}

function RelatedRow({ assets, onSearch }: { assets: any[]; onSearch: (q: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 10 }}>RELATED QUERIES</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {assets.slice(0, 3).map(asset => {
          const color = scoreColor(asset.certaintyScore)
          return (
            <div
              key={asset.asset}
              onClick={() => onSearch(asset.name)}
              style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {asset.symbol ?? asset.asset}
                  {asset.isPro && <span style={{ fontSize: 9, color: '#bf5af2' }}>★</span>}
                </div>
                <div style={{ fontSize: 10, color: asset.ratingColor, fontWeight: 600 }}>{asset.rating}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>
                {asset.priceFormatted}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
                {asset.publisherConsensus}/94 publishers
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 12, color: 'rgba(255,255,255,0.28)', cursor: 'pointer',
  background: 'none', border: 'none', fontFamily: 'inherit',
  padding: 0, flexShrink: 0, transition: 'color 0.15s',
}

const quickStyle: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 20, fontSize: 12,
  cursor: 'pointer', fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.55)', transition: 'all 0.15s',
}
