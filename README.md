# Veridian — Ask the market anything.

> Live oracle intelligence powered by Pyth Network.

Built for the **Pyth Playground Community Hackathon 2025**.

## What it does

Type any asset, question, or comparison. Veridian fetches live Pyth oracle data and returns an AI-generated verdict in under 2 seconds. No wallet. No setup. Just type.

**Examples:**
- `BTC` → live price, certainty score, publisher consensus, AI verdict
- `ETH vs SOL` → side-by-side comparison of oracle data quality
- `Market overview` → full snapshot across all assets with macro alert
- `Gold` → live XAU/USD via Pyth Pro with after-hours context
- `TSLA after hours` → live stock price even when NYSE is closed
- `Is EUR/USD stable?` → forex oracle health verdict
- `why is crypto pumping` → detected as crypto query → BTC/ETH overview
- `what's the weather` → friendly redirect ("Veridian only knows markets")

## Pyth Integration

| Feature | How it's used |
|---|---|
| **Pyth Price Feeds** | Every result is powered by live Pyth Hermes prices, updated every 400ms from 94 publishers |
| **Pyth Entropy** | Derives the Market Mood Score and macro alert — statistical baseline across all monitored feeds |
| **Pyth Pro** | Equities (SPX, TSLA, NVDA, AAPL), Forex (EUR/USD, GBP/USD, USD/JPY), Commodities (Gold, Oil, Silver) |

## Setup

### 1. Clone and install
```bash
git clone https://github.com/yourusername/veridian-oracle
cd veridian-oracle
npm install
```

### 2. Environment variables
```bash
# .env.local
GROQ_API_KEY=gsk_your-key-here          # Free at console.groq.com
PYTH_PRO_API_KEY=your-pyth-pro-key      # From Pyth Pro access
NEXT_PUBLIC_PYTH_HERMES=https://hermes.pyth.network  # Free, no key needed
```

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel
```bash
vercel
# Add GROQ_API_KEY and PYTH_PRO_API_KEY in Vercel dashboard → Settings → Environment Variables
```

## How it works

```
User types anything
       ↓
Intent check (is this market-related?)
       ↓ YES                    ↓ NO
Detect assets              Friendly redirect
       ↓
Fetch live Pyth prices (Hermes API)
       ↓
Calculate certainty score from confidence interval
       ↓
Build Pyth Entropy baseline (mood score, macro alert)
       ↓
Send to Groq AI → generate verdict + share text
       ↓
Display result card with live data
```

## Certainty Score

Pyth gives every price a confidence interval — how much 94 independent publishers agree. Veridian turns this into a 0–100 score:

- **≥ 70 → EXECUTE** — data is clean, publishers agree
- **50–69 → WAIT** — publisher spread elevated, proceed with caution
- **< 50 → ABORT** — publisher disagreement critical, do not act on this price

## Tech Stack

- Next.js 14 (App Router, Edge Runtime)
- Pyth Hermes REST API
- Groq API (llama-3.3-70b-versatile)
- TypeScript
- Vercel

## License

Apache 2.0
