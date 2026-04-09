// ═══════════════════════════════════════════════
// API
// All remote data fetching lives here.
// ═══════════════════════════════════════════════

import { state } from './state.js';

// ── Live price + previous close ──────────────────
export async function fetchPrice(ticker) {
  if (state.priceCache[ticker]) return state.priceCache[ticker];
  try {
    const res = await fetch(`/api/price?ticker=${ticker}`);
    const data = await res.json();
    if (data.price) {
      state.priceCache[ticker] = data.price;
      // Store previousClose — used for today's change calculation
      if (data.previousClose && data.previousClose > 0) {
        state.prevClosePrices[ticker] = data.previousClose;
      }
    }
    return data.price ?? null;
  } catch (e) {
    console.warn('fetchPrice failed:', ticker, e);
    return null;
  }
}

// ── Historical daily closes ──────────────────────
export async function fetchHistory(ticker, upstoxTicker, range = '2y') {
  const key = `${ticker}_${upstoxTicker || ''}_${range}`;
  if (state.historyCache[key]) return state.historyCache[key];

  try {
    const url = `/api/history?ticker=${ticker}&upstox_ticker=${upstoxTicker || ''}&range=${range}`;
    const res = await fetch(url);
    const data = await res.json();

    const series = {};
    const today = new Date().toISOString().split('T')[0];

    data.forEach((d) => {
      if (d.date === today) return; // skip today — live price covers it
      series[d.date] = d.price;
    });

    state.historyCache[key] = series;
    return series;
  } catch (e) {
    console.error('fetchHistory failed:', ticker, e);
    return null;
  }
}

// ── Intraday (5-min) data for day charts ─────────
// Uses dedicated /api/intraday endpoint which calls Yahoo with interval=5m&range=1d
export async function fetchDayHistory(ticker) {
  const key = `intraday_${ticker}`;
  if (state.dayHistoryCache[key]) return state.dayHistoryCache[key];

  try {
    const res = await fetch(`/api/intraday?ticker=${ticker}`);
    const data = await res.json();

    const series = (data.series || []);

    // Also grab previousClose from intraday response as a fallback
    if (data.previousClose && data.previousClose > 0 && !state.prevClosePrices[ticker]) {
      state.prevClosePrices[ticker] = data.previousClose;
    }

    state.dayHistoryCache[key] = series;
    return series;
  } catch (e) {
    console.warn('fetchDayHistory failed:', ticker, e);
    return [];
  }
}

// ── Portfolio CSV ────────────────────────────────
export async function fetchPortfolioCSV() {
  const res = await fetch('/api/portfolio');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
