'use client'
// src/components/SearchBox.tsx
import { forwardRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSearch: (q: string) => void
  loading?: boolean
  compact?: boolean
}

const SearchBox = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onSearch, loading, compact }, ref) => {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: compact ? '10px 14px' : '14px 16px',
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: compact ? 10 : 14,
        width: '100%',
        transition: 'border-color 0.2s',
      }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      >
        {loading ? (
          <div style={{
            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderTop: '1.5px solid #30d158',
          }} className="spin" />
        ) : (
          <svg
            width="16" height="16" viewBox="0 0 18 18" fill="none"
            stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="8" cy="8" r="5.5" /><path d="M13 13l2.5 2.5" />
          </svg>
        )}
        <input
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch(value)}
          placeholder={compact ? 'Search again...' : 'Try: BTC, Gold, ETH vs SOL, Is EUR/USD stable?'}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: compact ? 13 : 15, color: '#fff',
            fontFamily: 'inherit', fontWeight: 300, letterSpacing: '-0.01em',
          }}
        />
        <button
          onClick={() => onSearch(value)}
          disabled={loading || !value.trim()}
          style={{
            padding: compact ? '6px 14px' : '8px 18px',
            borderRadius: 9, background: '#fff', color: '#000',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
            opacity: loading || !value.trim() ? 0.5 : 1,
            transition: 'opacity 0.15s', whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Asking...' : 'Ask →'}
        </button>
      </div>
    )
  }
)

SearchBox.displayName = 'SearchBox'
export default SearchBox
