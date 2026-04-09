// ═══════════════════════════════════════════════
// DRILLDOWN
// Per-stock detail view with Day + History tabs.
// ═══════════════════════════════════════════════

import { state } from './state.js';
import { fmt, pct, colorPnl, showScreen } from './utils.js';
import { renderDrilldownChart, renderDrilldownDayChart } from './charts.js';
import { fetchDayChart } from './api.js';

export async function openDrilldown(ticker) {
  state.currentDDTicker = ticker;
  state.currentDDTab    = 'day';
  showScreen('drilldown-screen');

  const h = state.holdings[ticker];
  document.getElementById('dd-ticker').textContent   = ticker;
  document.getElementById('dd-subtitle').textContent =
    `${h.totalQty} shares · Avg buy: ${h.avgBuy.toFixed(2)} · Invested: ₹${h.invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const lp  = state.livePrices[ticker];
  const pc  = state.prevClosePrices[ticker];
  const currentVal  = lp ? lp * h.totalQty : null;
  const pnlVal      = currentVal ? currentVal - h.invested : null;
  const pnlPct      = pnlVal ? (pnlVal / h.invested) * 100 : null;
  const todayChgAbs = lp && pc ? lp - pc : null;
  const todayChgPct = lp && pc ? ((lp - pc) / pc) * 100 : null;

  let cagr = null;
  if (h.earliestDate && lp) {
    const days  = (Date.now() - new Date(h.earliestDate)) / (1000 * 60 * 60 * 24);
    const years = days / 365;
    if (years > 0.1) cagr = (Math.pow(lp / h.avgBuy, 1 / years) - 1) * 100;
  }

  document.getElementById('dd-cards').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Current Price</div>
      <div class="stat-value">${lp ? lp.toFixed(2) : '—'}</div>
      ${pc ? `<div class="stat-sub" style="color:${colorPnl(todayChgAbs)}">${todayChgAbs != null ? (todayChgAbs >= 0 ? '+' : '') + todayChgAbs.toFixed(2) + ' today' : ''}</div>` : ''}
    </div>
    <div class="stat-card">
      <div class="stat-label">Today's Change</div>
      <div class="stat-value" style="color:${todayChgPct != null ? colorPnl(todayChgPct) : 'var(--text2)'}">
        ${todayChgPct != null ? pct(todayChgPct) : '—'}
      </div>
      <div class="stat-sub" style="color:${todayChgAbs != null ? colorPnl(todayChgAbs) : 'var(--text2)'}">
        ${todayChgAbs != null ? (todayChgAbs >= 0 ? '+' : '') + fmt(Math.abs(todayChgAbs)) : ''}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">P&amp;L</div>
      <div class="stat-value" style="color:${pnlVal != null ? colorPnl(pnlVal) : 'inherit'}">
        ${pnlVal != null ? fmt(Math.abs(pnlVal)) : '—'}
      </div>
      <div class="stat-sub" style="color:${pnlPct != null ? colorPnl(pnlPct) : 'inherit'}">
        ${pnlPct != null ? pct(pnlPct) : ''}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Current Value</div>
      <div class="stat-value">${currentVal ? fmt(currentVal) : '—'}</div>
    </div>
    ${cagr != null ? `<div class="stat-card">
      <div class="stat-label">CAGR</div>
      <div class="stat-value" style="color:${colorPnl(cagr)}">${pct(cagr)}</div>
    </div>` : ''}`;

  // Default to Day tab
  switchTab('day');
}

export function switchTab(tab) {
  state.currentDDTab = tab;

  document.getElementById('dd-tab-day').classList.toggle('active',     tab === 'day');
  document.getElementById('dd-tab-history').classList.toggle('active', tab === 'history');
  document.getElementById('dd-panel-day').style.display     = tab === 'day'     ? 'block' : 'none';
  document.getElementById('dd-panel-history').style.display = tab === 'history' ? 'block' : 'none';

  if (tab === 'day')     _loadDayChart();
  if (tab === 'history') _loadHistoryChart();
}

export function setDDHistoryFilter(filter, btn) {
  state.ddHistoryFilter = filter;
  document.querySelectorAll('#dd-history-filters .tf-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  _loadHistoryChart();
}

async function _loadDayChart() {
  const ticker  = state.currentDDTicker;
  const dayData = await fetchDayChart(ticker);

  if (!dayData || !dayData.series || !dayData.series.length) {
    const el = document.getElementById('dd-day-change');
    if (el) el.textContent = 'No intraday data available for today.';
    return;
  }

  if (dayData.prevClose) state.prevClosePrices[ticker] = dayData.prevClose;
  renderDrilldownDayChart(dayData.series, dayData.prevClose);
}

function _loadHistoryChart() {
  const ticker = state.currentDDTicker;
  const hist   = state.histories && state.histories[ticker];
  const h      = state.holdings[ticker];
  if (hist) renderDrilldownChart(ticker, hist, h.earliestDate, state.ddHistoryFilter);
}
