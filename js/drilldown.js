// ═══════════════════════════════════════════════
// DRILLDOWN
// Per-stock detail view.
// ═══════════════════════════════════════════════

import { state } from './state.js';
import { fmt, pct, colorPnl, showScreen } from './utils.js';
import { renderDrilldownChart } from './charts.js';

export async function openDrilldown(ticker) {
  showScreen('drilldown-screen');

  const h = state.holdings[ticker];
  document.getElementById('dd-ticker').textContent = ticker;
  document.getElementById('dd-subtitle').textContent =
    `${h.totalQty} shares · Avg buy: ${h.avgBuy.toFixed(2)} · Invested: ₹${h.invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const lp = state.livePrices[ticker];
  const currentVal = lp ? lp * h.totalQty : null;
  const pnlVal = currentVal ? currentVal - h.invested : null;
  const pnlPct = pnlVal ? (pnlVal / h.invested) * 100 : null;

  // CAGR
  let cagr = null;
  if (h.earliestDate && lp) {
    const days = (Date.now() - new Date(h.earliestDate)) / (1000 * 60 * 60 * 24);
    const years = days / 365;
    if (years > 0.1) cagr = (Math.pow(lp / h.avgBuy, 1 / years) - 1) * 100;
  }

  document.getElementById('dd-cards').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Current Price</div>
      <div class="stat-value">${lp ? lp.toFixed(2) : '—'}</div>
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
    ${cagr != null
      ? `<div class="stat-card">
           <div class="stat-label">CAGR</div>
           <div class="stat-value" style="color:${colorPnl(cagr)}">${pct(cagr)}</div>
         </div>`
      : ''}`;

  // Price history chart
  const hist = state.histories && state.histories[ticker];
  if (hist) {
    renderDrilldownChart(ticker, hist, h.earliestDate);
  }
}
