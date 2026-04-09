// ═══════════════════════════════════════════════
// DASHBOARD
// Data loading, stat cards, holdings grid.
// ═══════════════════════════════════════════════

import { state, resetCaches, resetPriceCache } from './state.js';
import { fmt, pct, colorPnl, showScreen, showToast } from './utils.js';
import { fetchPrice, fetchHistory, fetchDayChart } from './api.js';
import { forwardFill, buildTimeSeries } from './timeSeries.js';
import {
  renderPortfolioChart, renderPieChart, renderPnlChart,
  renderFolioDayChart, destroyAllCharts, COLORS,
} from './charts.js';
import { startAutoRefresh, stopAutoRefresh, initAutoRefresh, updateLastUpdatedLabel } from './autoRefresh.js';

// ── Load (full — history + prices) ──────────────
export async function loadDashboard() {
  showScreen('dashboard-screen');

  const loadingDiv = document.getElementById('dash-loading');
  const contentDiv = document.getElementById('dash-content');
  const loadMsg   = document.getElementById('loading-msg');

  loadingDiv.style.display = 'flex';
  contentDiv.style.display = 'none';

  const tickers = Object.keys(state.holdings);

  try {
    // 1. Histories (parallel)
    loadMsg.textContent = `Fetching historic data for ${tickers.length} stocks…`;
    const historyResults = await Promise.all(
      tickers.map(async (ticker) => {
        const h = state.holdings[ticker];
        const hist = await fetchHistory(h.ticker, h.upstoxTicker, '2y');
        return { ticker, data: hist ? forwardFill(hist) : null };
      })
    );

    const histories = {};
    historyResults.forEach(({ ticker, data }) => { if (data) histories[ticker] = data; });

    // 2. Live prices (parallel)
    loadMsg.textContent = 'Fetching latest prices…';
    const priceResults = await Promise.all(
      tickers.map(async (ticker) => {
        let price = await fetchPrice(ticker);
        if (!price && histories[ticker]) {
          const dates = Object.keys(histories[ticker]).sort();
          price = histories[ticker][dates[dates.length - 1]];
        }
        return { ticker, price };
      })
    );
    priceResults.forEach(({ ticker, price }) => { state.livePrices[ticker] = price; });

    // 3. Time series
    loadMsg.textContent = 'Building portfolio chart…';
    state.fullTimeSeries = await buildTimeSeries(histories);
    state.histories = histories;
    state.lastUpdated = new Date();

    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';

    renderDashboard();

    // 4. Wire auto-refresh (prices only, not history)
    initAutoRefresh(refreshPricesOnly);
    startAutoRefresh();

  } catch (err) {
    console.error(err);
    loadingDiv.innerHTML = `<div class="error-box">Failed to load portfolio data. ${err.message}</div>`;
  }
}

// ── Refresh prices only (fast) ───────────────────
export async function refreshPricesOnly() {
  showToast('Refreshing prices…');
  resetPriceCache();

  const tickers = Object.keys(state.holdings);
  await Promise.all(
    tickers.map(async (ticker) => {
      let price = await fetchPrice(ticker);
      if (!price && state.histories[ticker]) {
        const dates = Object.keys(state.histories[ticker]).sort();
        price = state.histories[ticker][dates[dates.length - 1]];
      }
      state.livePrices[ticker] = price;
    })
  );

  state.lastUpdated = new Date();
  renderDashboard();
  showToast('Prices updated ✓');
}

// ── Full refresh ─────────────────────────────────
export async function refreshDashboard() {
  showToast('Refreshing…');
  stopAutoRefresh();
  resetCaches();
  destroyAllCharts();
  await loadDashboard();
  showToast('Portfolio updated 🚀');
}

// ── Render ───────────────────────────────────────
export function renderDashboard() {
  const holdings = Object.values(state.holdings);

  let totalInvested = 0, totalCurrent = 0, totalPrevClose = 0;
  holdings.forEach((h) => {
    const lp = state.livePrices[h.ticker];
    const pc = state.prevClosePrices[h.ticker];
    totalInvested += h.invested;
    if (lp) totalCurrent += lp * h.totalQty;
    if (pc) totalPrevClose += pc * h.totalQty;
  });

  const totalPnl    = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested ? (totalPnl / totalInvested) * 100 : 0;
  const todayChange    = totalPrevClose ? totalCurrent - totalPrevClose : null;
  const todayChangePct = totalPrevClose ? (todayChange / totalPrevClose) * 100 : null;

  let best = null, worst = null;
  holdings.forEach((h) => {
    const lp = state.livePrices[h.ticker];
    if (!lp) return;
    const p = ((lp - h.avgBuy) / h.avgBuy) * 100;
    if (!best  || p > best.pct)  best  = { ticker: h.ticker, pct: p };
    if (!worst || p < worst.pct) worst = { ticker: h.ticker, pct: p };
  });

  renderStatCards({ totalInvested, totalCurrent, totalPnl, totalPnlPct, todayChange, todayChangePct, best, holdings });
  updateLastUpdatedLabel();
  renderFolioDayChart(holdings);      // async, fills in today change card when done
  renderPortfolioChart(state.currentFilter);
  renderPieChart(holdings, totalCurrent);
  renderPnlChart(holdings);
  renderHoldingCards(holdings, totalCurrent);
}

function renderStatCards({ totalInvested, totalCurrent, totalPnl, totalPnlPct, todayChange, todayChangePct, best, holdings }) {
  document.getElementById('stat-cards').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Invested</div>
      <div class="stat-value">${fmt(totalInvested)}</div>
      <div class="stat-sub">${holdings.length} stocks</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Current Value</div>
      <div class="stat-value" style="color:${totalCurrent ? 'var(--text)' : 'var(--text2)'}">
        ${totalCurrent ? fmt(totalCurrent) : 'Fetching…'}
      </div>
      <div class="stat-sub" style="color:${colorPnl(totalPnl)}">
        ${totalCurrent ? pct(totalPnlPct) + ' overall' : ''}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total P&amp;L</div>
      <div class="stat-value" style="color:${colorPnl(totalPnl)}">
        ${totalCurrent ? fmt(Math.abs(totalPnl)) : '—'}
      </div>
      <div class="stat-sub" style="color:${colorPnl(totalPnl)}">
        ${totalCurrent ? (totalPnl >= 0 ? 'Profit' : 'Loss') + ' · ' + pct(totalPnlPct) : ''}
      </div>
    </div>
    <div class="stat-card" id="today-change-card">
      <div class="stat-label">Today's Change</div>
      <div class="stat-value" style="color:${todayChange != null ? colorPnl(todayChange) : 'var(--text2)'}">
        ${todayChange != null ? (todayChange >= 0 ? '+' : '') + fmt(Math.abs(todayChange)) : '—'}
      </div>
      <div class="stat-sub" style="color:${todayChangePct != null ? colorPnl(todayChangePct) : 'var(--text2)'}">
        ${todayChangePct != null ? pct(todayChangePct) + ' today' : 'Loading intraday…'}
      </div>
    </div>
    ${best ? `<div class="stat-card">
      <div class="stat-label">Best Performer</div>
      <div class="stat-value" style="color:var(--green);font-size:1.3rem">${best.ticker}</div>
      <div class="stat-sub" style="color:var(--green)">${pct(best.pct)}</div>
    </div>` : ''}`;
}

// Called by charts.js after intraday data loads to update the today card
export function updateTodayChangeCard() {
  const card = document.getElementById('today-change-card');
  if (!card) return;

  const holdings = Object.values(state.holdings);
  let totalCurrent = 0, totalPrevClose = 0;
  holdings.forEach((h) => {
    const lp = state.livePrices[h.ticker];
    const pc = state.prevClosePrices[h.ticker];
    if (lp) totalCurrent += lp * h.totalQty;
    if (pc) totalPrevClose += pc * h.totalQty;
  });

  if (!totalPrevClose) return;
  const todayChange    = totalCurrent - totalPrevClose;
  const todayChangePct = (todayChange / totalPrevClose) * 100;

  card.innerHTML = `
    <div class="stat-label">Today's Change</div>
    <div class="stat-value" style="color:${colorPnl(todayChange)}">
      ${(todayChange >= 0 ? '+' : '') + fmt(Math.abs(todayChange))}
    </div>
    <div class="stat-sub" style="color:${colorPnl(todayChangePct)}">
      ${pct(todayChangePct)} today
    </div>`;
}

function renderHoldingCards(holdings, totalCurrent) {
  const grid = document.getElementById('holdings-grid');
  grid.innerHTML = '';

  holdings.forEach((h, i) => {
    const lp  = state.livePrices[h.ticker];
    const pc  = state.prevClosePrices[h.ticker];
    const currentVal = lp ? lp * h.totalQty : null;
    const pnlVal     = currentVal ? currentVal - h.invested : null;
    const pnlPct     = pnlVal ? (pnlVal / h.invested) * 100 : null;
    const allocPct   = totalCurrent && currentVal ? (currentVal / totalCurrent) * 100 : null;
    const todayChg   = lp && pc ? ((lp - pc) / pc) * 100 : null;
    const color = COLORS[i % COLORS.length];

    const card = document.createElement('div');
    card.className = 'holding-card';
    card.onclick = () => import('./drilldown.js').then((m) => m.openDrilldown(h.ticker));

    card.innerHTML = `
      <div class="hc-top">
        <div>
          <div class="hc-ticker">${h.ticker}</div>
          <div class="hc-name">Qty: ${h.totalQty} · Avg: ${h.avgBuy.toFixed(2)}</div>
        </div>
        <div class="hc-pnl">
          <div class="hc-pnl-val" style="color:${pnlVal != null ? colorPnl(pnlVal) : 'var(--text2)'}">
            ${pnlVal != null ? (pnlVal >= 0 ? '+' : '') + pnlVal.toFixed(0) : '—'}
          </div>
          <div class="hc-pnl-pct" style="color:${pnlPct != null ? colorPnl(pnlPct) : 'var(--text2)'}">
            ${pnlPct != null ? pct(pnlPct) : 'no price'}
          </div>
        </div>
      </div>
      ${todayChg != null ? `
      <div class="hc-today" style="margin-bottom:0.6rem">
        <span class="today-badge ${todayChg >= 0 ? 'up' : 'down'}">
          ${todayChg >= 0 ? '▲' : '▼'} Today ${pct(todayChg)}
        </span>
      </div>` : ''}
      <div class="hc-bar-bg">
        <div class="hc-bar" style="width:${allocPct ? Math.min(100, allocPct * 2) : 10}%;background:${color}"></div>
      </div>
      <div class="hc-bottom">
        <div><div class="hc-meta-label">Invested</div><div class="hc-meta-val">${fmt(h.invested)}</div></div>
        <div><div class="hc-meta-label">Current</div><div class="hc-meta-val">${currentVal ? fmt(currentVal) : '—'}</div></div>
        <div><div class="hc-meta-label">Live Price</div><div class="hc-meta-val">${lp ? lp.toFixed(2) : '—'}</div></div>
        <div><div class="hc-meta-label">Allocation</div><div class="hc-meta-val">${allocPct ? allocPct.toFixed(1) + '%' : '—'}</div></div>
      </div>`;

    grid.appendChild(card);
  });
}
