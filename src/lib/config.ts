// src/lib/config.ts

export const PYTH_FEEDS: Record<string, string> = {
  // Cryptocurrencies (22+)
  BTC:   "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH:   "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  SOL:   "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  PYTH:  "0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff",
  USDC:  "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  USDT:  "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
  XRP:   "0xec5f8a9c2e2a6e5e7f0a9b5c8d7e6f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
  DOGE:  "0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c",
  ADA:   "0x3a3f2f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
  BNB:   "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
  LINK:  "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221",
  AVAX:  "0x93da3352f9f1d105fdfe4971cfa80e9269ef23a9a5ce3ea9d3fabb573e7a5c0e",
  MATIC: "0x5de33a9112c2b700b8d30b8a3402949456b181f7886d2f2e45c6f21e8d502189",
  ARB:   "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5",
  OP:    "0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf",
  TON:   "0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
  SUI:   "0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
  APT:   "0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
  NEAR:  "0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
  TRX:   "0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",

  // Commodities
  XAU_USD: "0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2",
  XAG_USD: "0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e",
  WTI_USD: "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",

  // Forex
  EUR_USD: "0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b",
  GBP_USD: "0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7e1",
  USD_JPY: "0xef2c98c804ba503c6a707e38be4dfbb16683b57f8d8a3b8a5c36ab4e03e3e0e3",
};

export const ASSET_META: Record<string, any> = {
  BTC:   { name: "Bitcoin",      symbol: "BTC",  icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",     iconBg: "#f7931a", iconColor: "#fff", category: "crypto", isPro: false, decimals: 0,  baselineConfPct: 0.0005 },
  ETH:   { name: "Ethereum",     symbol: "ETH",  icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",    iconBg: "#627eea", iconColor: "#fff", category: "crypto", isPro: false, decimals: 2,  baselineConfPct: 0.0010 },
  SOL:   { name: "Solana",       symbol: "SOL",  icon: "https://cryptologos.cc/logos/solana-sol-logo.png",      iconBg: "#14f195", iconColor: "#000", category: "crypto", isPro: false, decimals: 2,  baselineConfPct: 0.0012 },
  PYTH:  { name: "Pyth Network", symbol: "PYTH", icon: "https://cryptologos.cc/logos/pyth-network-pyth-logo.png", iconBg: "#00a3ff", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4, baselineConfPct: 0.0020 },
  USDC:  { name: "USD Coin",     symbol: "USDC", icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",   iconBg: "#2775ca", iconColor: "#fff", category: "crypto", isPro: false, decimals: 2,  baselineConfPct: 0.0001 },
  USDT:  { name: "Tether",       symbol: "USDT", icon: "https://cryptologos.cc/logos/tether-usdt-logo.png",     iconBg: "#26a17b", iconColor: "#fff", category: "crypto", isPro: false, decimals: 2,  baselineConfPct: 0.0001 },
  XRP:   { name: "XRP",          symbol: "XRP",  icon: "https://cryptologos.cc/logos/xrp-xrp-logo.png",         iconBg: "#23292f", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0015 },
  DOGE:  { name: "Dogecoin",     symbol: "DOGE", icon: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",   iconBg: "#c2a633", iconColor: "#000", category: "crypto", isPro: false, decimals: 5,  baselineConfPct: 0.0020 },
  ADA:   { name: "Cardano",      symbol: "ADA",  icon: "https://cryptologos.cc/logos/cardano-ada-logo.png",     iconBg: "#0033ad", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0018 },
  BNB:   { name: "BNB",          symbol: "BNB",  icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",         iconBg: "#f3ba2f", iconColor: "#000", category: "crypto", isPro: false, decimals: 2,  baselineConfPct: 0.0010 },
  LINK:  { name: "Chainlink",    symbol: "LINK", icon: "https://cryptologos.cc/logos/chainlink-link-logo.png",  iconBg: "#2a5ada", iconColor: "#fff", category: "crypto", isPro: false, decimals: 3,  baselineConfPct: 0.0018 },
  AVAX:  { name: "Avalanche",    symbol: "AVAX", icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",  iconBg: "#e84142", iconColor: "#fff", category: "crypto", isPro: false, decimals: 2,  baselineConfPct: 0.0015 },
  MATIC: { name: "Polygon",      symbol: "MATIC",icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",  iconBg: "#8247e5", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0020 },
  ARB:   { name: "Arbitrum",     symbol: "ARB",  icon: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",    iconBg: "#12aaff", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0020 },
  OP:    { name: "Optimism",     symbol: "OP",   icon: "https://cryptologos.cc/logos/optimism-op-logo.png",     iconBg: "#ff0420", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0020 },
  TON:   { name: "Toncoin",      symbol: "TON",  icon: "https://cryptologos.cc/logos/toncoin-ton-logo.png",     iconBg: "#0098ea", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0015 },
  SUI:   { name: "Sui",          symbol: "SUI",  icon: "https://cryptologos.cc/logos/sui-sui-logo.png",         iconBg: "#6fb0f0", iconColor: "#000", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0020 },
  APT:   { name: "Aptos",        symbol: "APT",  icon: "https://cryptologos.cc/logos/aptos-apt-logo.png",       iconBg: "#4a4a4a", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0018 },
  NEAR:  { name: "NEAR Protocol",symbol: "NEAR", icon: "https://cryptologos.cc/logos/near-protocol-near-logo.png", iconBg: "#000", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0015 },
  TRX:   { name: "TRON",         symbol: "TRX",  icon: "https://cryptologos.cc/logos/tron-trx-logo.png",        iconBg: "#ff0013", iconColor: "#fff", category: "crypto", isPro: false, decimals: 4,  baselineConfPct: 0.0012 },

  // Commodities & Forex
  XAU_USD: { name: "Gold",       symbol: "XAU",  icon: "https://cryptologos.cc/logos/gold-xau-logo.png",       iconBg: "#f4c430", iconColor: "#000", category: "commodity", isPro: true, decimals: 2, baselineConfPct: 0.0006 },
  XAG_USD: { name: "Silver",     symbol: "XAG",  icon: "https://cryptologos.cc/logos/silver-xag-logo.png",     iconBg: "#c0c0c0", iconColor: "#000", category: "commodity", isPro: true, decimals: 3, baselineConfPct: 0.0012 },
  WTI_USD: { name: "Oil (WTI)",  symbol: "WTI",  icon: "https://cryptologos.cc/logos/oil-wti-logo.png",        iconBg: "#8B4513", iconColor: "#fff", category: "commodity", isPro: true, decimals: 2, baselineConfPct: 0.0008 },
  EUR_USD: { name: "Euro",       symbol: "EUR",  icon: "https://cryptologos.cc/logos/euro-eur-logo.png",       iconBg: "#003399", iconColor: "#fff", category: "forex", isPro: true, decimals: 5, baselineConfPct: 0.0002 },
  GBP_USD: { name: "British Pound", symbol: "GBP", icon: "https://cryptologos.cc/logos/pound-gbp-logo.png",    iconBg: "#003399", iconColor: "#fff", category: "forex", isPro: true, decimals: 5, baselineConfPct: 0.0003 },
  USD_JPY: { name: "Japanese Yen", symbol: "JPY", icon: "https://cryptologos.cc/logos/yen-jpy-logo.png",       iconBg: "#bc002d", iconColor: "#fff", category: "forex", isPro: true, decimals: 3, baselineConfPct: 0.0002 },
};

// Safe getter for any asset
export const getAssetMeta = (asset: string) => {
  return ASSET_META[asset] || {
    name: asset.toUpperCase(),
    symbol: asset.toUpperCase(),
    icon: "https://cryptologos.cc/logos/question-mark-logo.png",
    iconBg: "#666666",
    iconColor: "#ffffff",
    category: "crypto",
    isPro: false,
    decimals: 2,
    baselineConfPct: 0.001,
  };
};

// Comprehensive Keyword Map
export const KEYWORD_MAP: Record<string, string> = {
  "bitcoin": "BTC", "btc": "BTC",
  "ethereum": "ETH", "eth": "ETH",
  "solana": "SOL", "sol": "SOL",
  "pyth": "PYTH", "pyth network": "PYTH",
  "usd coin": "USDC", "usdc": "USDC",
  "tether": "USDT", "usdt": "USDT",
  "xrp": "XRP",
  "dogecoin": "DOGE", "doge": "DOGE",
  "cardano": "ADA", "ada": "ADA",
  "bnb": "BNB", "binance": "BNB",
  "chainlink": "LINK", "link": "LINK",
  "avalanche": "AVAX", "avax": "AVAX",
  "polygon": "MATIC", "matic": "MATIC",
  "arbitrum": "ARB", "arb": "ARB",
  "optimism": "OP", "op": "OP",
  "toncoin": "TON", "ton": "TON",
  "sui": "SUI",
  "aptos": "APT", "apt": "APT",
  "near": "NEAR",
  "tron": "TRX", "trx": "TRX",

  // Commodities & Forex
  "gold": "XAU_USD", "xau": "XAU_USD",
  "silver": "XAG_USD", "xag": "XAG_USD",
  "oil": "WTI_USD", "wti": "WTI_USD", "crude": "WTI_USD",
  "euro": "EUR_USD", "eur": "EUR_USD",
  "pound": "GBP_USD", "gbp": "GBP_USD",
  "yen": "USD_JPY", "jpy": "USD_JPY",
};

export const TOTAL_PUBLISHERS = 94;