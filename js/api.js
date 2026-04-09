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

export async function fetchDayChart(ticker) {
  if (state.dayChartCache[ticker]) return state.dayChartCache[ticker];
  try {
    const res = await fetch(`/api/dayChart?ticker=${ticker}`);
    const data = await res.json();
    state.dayChartCache[ticker] = data;
    return data;
  } catch (e) {
    console.warn('fetchDayChart failed:', ticker, e);
    return null;
  }
}

export async function fetchPortfolioCSV() {
  const res = await fetch('/api/portfolio');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
