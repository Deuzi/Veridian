// src/lib/config.ts

export const PYTH_FEEDS: Record<string, string> = {
  BTC:     '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH:     '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL:     '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  AVAX:    '0x93da3352f9f1d105fdfe4971cfa80e9269ef23a9a5ce3ea9d3fabb573e7a5c0e',
  LINK:    '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  BNB:     '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  DOGE:    '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  MATIC:   '0x5de33a9112c2b700b8d30b8a3402949456b181f7886d2f2e45c6f21e8d502189',
  // Pyth Pro — Equities
  SPX:     '0x694277a8d3c99900e18e9e16e55e5e3e94c0a3d61b72e92ee9b3be6b8fd9f05c',
  TSLA:    '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
  NVDA:    '0xb3654dc3bf39c8f99d57beed62a7a32f4e29fc7498eebb7e7d13e8d7e39bf506',
  AAPL:    '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  // Pyth Pro — Forex
  EUR_USD: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
  GBP_USD: '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7e1',
  USD_JPY: '0xef2c98c804ba503c6a707e38be4dfbb16683b57f8d8a3b8a5c36ab4e03e3e0e3',
  // Pyth Pro — Commodities
  XAU_USD: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  XAG_USD: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e',
  WTI_USD: '0x59aee78a2a6b09f9e1f7de82e9a6e5d3f0d64e8e5b2e2b09d17b5c2b9b9bc15',
}

export interface AssetMeta {
  name: string
  symbol: string
  icon: string
  iconBg: string
  iconColor: string
  category: 'crypto' | 'equity' | 'forex' | 'commodity'
  isPro: boolean
  decimals: number
  baselineConfPct: number
}

export const ASSET_META: Record<string, AssetMeta> = {
  BTC:     { name:'Bitcoin',      symbol:'BTC/USD',   icon:'₿', iconBg:'rgba(247,147,26,0.15)', iconColor:'#f7931a', category:'crypto',    isPro:false, decimals:0, baselineConfPct:0.0008 },
  ETH:     { name:'Ethereum',     symbol:'ETH/USD',   icon:'Ξ', iconBg:'rgba(98,126,234,0.15)',  iconColor:'#627eea', category:'crypto',    isPro:false, decimals:2, baselineConfPct:0.0010 },
  SOL:     { name:'Solana',       symbol:'SOL/USD',   icon:'◎', iconBg:'rgba(153,69,255,0.15)',  iconColor:'#9945ff', category:'crypto',    isPro:false, decimals:2, baselineConfPct:0.0012 },
  AVAX:    { name:'Avalanche',    symbol:'AVAX/USD',  icon:'▲', iconBg:'rgba(232,65,66,0.15)',   iconColor:'#e84142', category:'crypto',    isPro:false, decimals:2, baselineConfPct:0.0015 },
  LINK:    { name:'Chainlink',    symbol:'LINK/USD',  icon:'⬡', iconBg:'rgba(42,90,218,0.15)',   iconColor:'#2a5ada', category:'crypto',    isPro:false, decimals:3, baselineConfPct:0.0018 },
  BNB:     { name:'BNB',          symbol:'BNB/USD',   icon:'◆', iconBg:'rgba(243,186,47,0.15)',  iconColor:'#f3ba2f', category:'crypto',    isPro:false, decimals:2, baselineConfPct:0.0010 },
  DOGE:    { name:'Dogecoin',     symbol:'DOGE/USD',  icon:'Ð', iconBg:'rgba(194,166,51,0.15)',  iconColor:'#c2a633', category:'crypto',    isPro:false, decimals:5, baselineConfPct:0.0020 },
  MATIC:   { name:'Polygon',      symbol:'MATIC/USD', icon:'⬟', iconBg:'rgba(130,71,229,0.15)',  iconColor:'#8247e5', category:'crypto',    isPro:false, decimals:4, baselineConfPct:0.0020 },
  SPX:     { name:'S&P 500',      symbol:'SPX/USD',   icon:'S', iconBg:'rgba(191,90,242,0.15)',  iconColor:'#bf5af2', category:'equity',    isPro:true,  decimals:0, baselineConfPct:0.0004 },
  TSLA:    { name:'Tesla',        symbol:'TSLA/USD',  icon:'T', iconBg:'rgba(191,90,242,0.15)',  iconColor:'#bf5af2', category:'equity',    isPro:true,  decimals:2, baselineConfPct:0.0010 },
  NVDA:    { name:'NVIDIA',       symbol:'NVDA/USD',  icon:'N', iconBg:'rgba(191,90,242,0.15)',  iconColor:'#bf5af2', category:'equity',    isPro:true,  decimals:2, baselineConfPct:0.0010 },
  AAPL:    { name:'Apple',        symbol:'AAPL/USD',  icon:'A', iconBg:'rgba(191,90,242,0.15)',  iconColor:'#bf5af2', category:'equity',    isPro:true,  decimals:2, baselineConfPct:0.0006 },
  EUR_USD: { name:'Euro',         symbol:'EUR/USD',   icon:'€', iconBg:'rgba(10,132,255,0.15)',  iconColor:'#0a84ff', category:'forex',     isPro:true,  decimals:5, baselineConfPct:0.0002 },
  GBP_USD: { name:'British Pound',symbol:'GBP/USD',   icon:'£', iconBg:'rgba(10,132,255,0.15)',  iconColor:'#0a84ff', category:'forex',     isPro:true,  decimals:5, baselineConfPct:0.0003 },
  USD_JPY: { name:'Japanese Yen', symbol:'USD/JPY',   icon:'¥', iconBg:'rgba(10,132,255,0.15)',  iconColor:'#0a84ff', category:'forex',     isPro:true,  decimals:3, baselineConfPct:0.0002 },
  XAU_USD: { name:'Gold',         symbol:'XAU/USD',   icon:'Au',iconBg:'rgba(255,159,10,0.15)',  iconColor:'#ff9f0a', category:'commodity', isPro:true,  decimals:2, baselineConfPct:0.0006 },
  XAG_USD: { name:'Silver',       symbol:'XAG/USD',   icon:'Ag',iconBg:'rgba(255,159,10,0.15)',  iconColor:'#ff9f0a', category:'commodity', isPro:true,  decimals:3, baselineConfPct:0.0012 },
  WTI_USD: { name:'Oil (WTI)',    symbol:'WTI/USD',   icon:'◉', iconBg:'rgba(255,69,58,0.15)',   iconColor:'#ff453a', category:'commodity', isPro:true,  decimals:2, baselineConfPct:0.0008 },
}

// Keyword → asset key mapping for intent detection
export const KEYWORD_MAP: Record<string, string> = {
  'bitcoin': 'BTC', 'btc': 'BTC',
  'ethereum': 'ETH', 'eth': 'ETH', 'ether': 'ETH',
  'solana': 'SOL', 'sol': 'SOL',
  'avalanche': 'AVAX', 'avax': 'AVAX',
  'chainlink': 'LINK', 'link': 'LINK',
  'bnb': 'BNB', 'binance': 'BNB',
  'dogecoin': 'DOGE', 'doge': 'DOGE',
  'polygon': 'MATIC', 'matic': 'MATIC',
  's&p': 'SPX', 'sp500': 'SPX', 'spx': 'SPX', 's&p 500': 'SPX', 'sp 500': 'SPX',
  'tesla': 'TSLA', 'tsla': 'TSLA',
  'nvidia': 'NVDA', 'nvda': 'NVDA',
  'apple': 'AAPL', 'aapl': 'AAPL',
  'euro': 'EUR_USD', 'eur': 'EUR_USD', 'eurusd': 'EUR_USD', 'eur/usd': 'EUR_USD',
  'pound': 'GBP_USD', 'gbp': 'GBP_USD', 'gbp/usd': 'GBP_USD', 'sterling': 'GBP_USD',
  'yen': 'USD_JPY', 'jpy': 'USD_JPY', 'usd/jpy': 'USD_JPY', 'usdjpy': 'USD_JPY',
  'gold': 'XAU_USD', 'xau': 'XAU_USD',
  'silver': 'XAG_USD', 'xag': 'XAG_USD',
  'oil': 'WTI_USD', 'wti': 'WTI_USD', 'crude': 'WTI_USD', 'petroleum': 'WTI_USD',
}

// Total publishers
export const TOTAL_PUBLISHERS = 94
