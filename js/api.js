// ═══════════════════════════════════════════════
// API
// All remote data fetching lives here.
// ═══════════════════════════════════════════════

import { state } from './state.js';

/**
 * Fetch the latest live price for a ticker.
 * Results are memoised in state.priceCache.
 */
export async function fetchPrice(ticker) {
  if (state.priceCache[ticker]) return state.priceCache[ticker];
  try {
    const res = await fetch(`/api/price?ticker=${ticker}`);
    const data = await res.json();
    state.priceCache[ticker] = data.price;
    return data.price;
  } catch (e) {
    console.warn('fetchPrice failed:', ticker, e);
    return null;
  }
}

/**
 * Fetch OHLC history for a ticker.
 * Returns a { date → price } map (close prices).
 * Results are memoised in state.historyCache.
 */
export async function fetchHistory(ticker, upstoxTicker, range = '2y') {
  const key = `${ticker}_${upstoxTicker || ''}_${range}`;
  if (state.historyCache[key]) return state.historyCache[key];

  try {
    const url = `/api/history?ticker=${ticker}&upstox_ticker=${upstoxTicker || ''}&range=${range}`;
    const res = await fetch(url);
    const data = await res.json();

    const series = {};

    // ✅ Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    data.forEach((d) => {
      // ✅ Skip today's data
      if (d.date === today) return;

      series[d.date] = d.price;
    });

    state.historyCache[key] = series;
    return series;
  } catch (e) {
    console.error('fetchHistory failed:', ticker, e);
    return null;
  }
}

/**
 * Load the user's own portfolio CSV from the server.
 */
export async function fetchPortfolioCSV() {
  const res = await fetch('/api/portfolio');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
