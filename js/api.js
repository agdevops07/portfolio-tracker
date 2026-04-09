// ═══════════════════════════════════════════════
// API
// All remote data fetching lives here.
// ═══════════════════════════════════════════════

import { state } from './state.js';

export async function fetchPrice(ticker) {
  if (state.priceCache[ticker]) return state.priceCache[ticker];
  try {
    const res = await fetch(`/api/price?ticker=${ticker}`);
    const data = await res.json();
    state.priceCache[ticker] = data.price;
    if (data.previousClose) state.prevClosePrices[ticker] = data.previousClose;
    return data.price;
  } catch (e) {
    console.warn('fetchPrice failed:', ticker, e);
    return null;
  }
}

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

// Fetch today's intraday / 1d data
export async function fetchDayHistory(ticker, upstoxTicker) {
  const key = `day_${ticker}_${upstoxTicker || ''}`;
  if (state.dayHistoryCache[key]) return state.dayHistoryCache[key];

  try {
    // Use 5d range and filter to today only — Yahoo Finance 1d interval
    const url = `/api/history?ticker=${ticker}&upstox_ticker=${upstoxTicker || ''}&range=5d&interval=1d`;
    const res = await fetch(url);
    const data = await res.json();

    const today = new Date().toISOString().split('T')[0];
    // Return full sorted array for day chart (use last few days if today not available)
    const series = Array.isArray(data)
      ? data.map(d => ({ time: d.date, price: d.price }))
      : [];

    const sorted = series.sort((a, b) => a.time.localeCompare(b.time));
    state.dayHistoryCache[key] = sorted;
    return sorted;
  } catch (e) {
    console.warn('fetchDayHistory failed:', ticker, e);
    return [];
  }
}

export async function fetchPortfolioCSV() {
  const res = await fetch('/api/portfolio');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
