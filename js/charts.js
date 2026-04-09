// ═══════════════════════════════════════════════
// CHARTS
// All Chart.js instances live here.
// ═══════════════════════════════════════════════

import { state } from './state.js';
import { filterTimeSeries } from './timeSeries.js';
import { fetchDayChart } from './api.js';
import { pct, colorPnl } from './utils.js';

export const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
];

const TOOLTIP_DEFAULTS = {
  backgroundColor: '#1a1a1f',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  titleColor: '#8a8a9a',
  bodyColor: '#f0f0f5',
  padding: 10,
};

const AXIS_DEFAULTS = {
  grid: { color: 'rgba(255,255,255,0.04)' },
  ticks: { color: '#55556a', font: { size: 11 } },
};

// ── Portfolio line chart ─────────────────────────
export function renderPortfolioChart(filter) {
  const series = filterTimeSeries(filter);
  const labels = series.map((p) => p.date);
  const values = series.map((p) => p.value);

  const isUp = values.length > 1 && values[values.length - 1] >= values[0];
  const color = isUp ? '#22c55e' : '#ef4444';

  if (state.portfolioChartInstance) state.portfolioChartInstance.destroy();

  const ctx = document.getElementById('portfolioChart').getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, isUp ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  state.portfolioChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color,
        borderWidth: 2,
        backgroundColor: grad,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP_DEFAULTS,
          mode: 'index',
          intersect: false,
          callbacks: { label: (ctx) => '  ₹' + ctx.parsed.y.toLocaleString('en-IN') },
        },
      },
      scales: {
        x: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, maxTicksLimit: 8 } },
        y: {
          ...AXIS_DEFAULTS,
          ticks: {
            ...AXIS_DEFAULTS.ticks,
            callback: (v) => '₹' + v.toLocaleString('en-IN', { notation: 'compact', maximumFractionDigits: 1 }),
          },
        },
      },
      interaction: { mode: 'index', intersect: false },
    },
  });
}

export function setTimeFilter(filter, btn) {
  state.currentFilter = filter;
  document.querySelectorAll('#portfolio-time-filters .tf-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  renderPortfolioChart(filter);
}

// ── Portfolio day chart ──────────────────────────
export async function renderFolioDayChart(holdings) {
  const allDay = {};

  for (const h of holdings) {
    const dayData = await fetchDayChart(h.ticker);
    if (!dayData || !dayData.series) continue;

    // Store prev-close per ticker for Today's Change card
    if (dayData.prevClose) state.prevClosePrices[h.ticker] = dayData.prevClose;

    dayData.series.forEach((pt) => {
      if (!allDay[pt.time]) allDay[pt.time] = 0;
      allDay[pt.time] += pt.price * h.totalQty;
    });
  }

  // After all prev closes loaded, update the Today card
  const { updateTodayChangeCard } = await import('./dashboard.js');
  updateTodayChangeCard();

  const times  = Object.keys(allDay).sort();
  if (!times.length) {
    const note = document.getElementById('folio-day-note');
    if (note) note.textContent = 'No intraday data available';
    return;
  }

  const values = times.map((t) => parseFloat(allDay[t].toFixed(0)));
  const labels = times.map((t) =>
    new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );

  const first = values[0], last = values[values.length - 1];
  const dayChg    = last - first;
  const dayChgPct = first ? (dayChg / first) * 100 : 0;
  const isUp = dayChg >= 0;

  const changeEl = document.getElementById('folio-day-change');
  if (changeEl) {
    changeEl.innerHTML =
      `<span style="color:${colorPnl(dayChg)};font-weight:700">${isUp ? '+' : ''}₹${Math.abs(dayChg).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${pct(dayChgPct)})</span>` +
      ` <span style="color:var(--text3)">since open</span>`;
  }

  if (state.folioDayChartInstance) state.folioDayChartInstance.destroy();

  const ctx   = document.getElementById('folioDayChart').getContext('2d');
  const color = isUp ? '#22c55e' : '#ef4444';
  const grad  = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, isUp ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  state.folioDayChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color,
        borderWidth: 2,
        backgroundColor: grad,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP_DEFAULTS,
          mode: 'index',
          intersect: false,
          callbacks: { label: (ctx) => '  ₹' + ctx.parsed.y.toLocaleString('en-IN') },
        },
      },
      scales: {
        x: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, maxTicksLimit: 8 } },
        y: {
          ...AXIS_DEFAULTS,
          ticks: {
            ...AXIS_DEFAULTS.ticks,
            callback: (v) => '₹' + v.toLocaleString('en-IN', { notation: 'compact', maximumFractionDigits: 1 }),
          },
        },
      },
      interaction: { mode: 'index', intersect: false },
    },
  });
}

// ── Allocation doughnut ──────────────────────────
export function renderPieChart(holdings, totalCurrent) {
  const filtered = holdings.filter((h) => (state.livePrices[h.ticker] || 0) > 0);
  const data   = filtered.map((h) => state.livePrices[h.ticker] * h.totalQty);
  const labels = filtered.map((h) => h.ticker);
  const total  = data.reduce((a, b) => a + b, 0);

  if (state.pieChartInstance) state.pieChartInstance.destroy();

  const ctx = document.getElementById('pieChart').getContext('2d');
  state.pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 2,
        borderColor: '#141417',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#8a8a9a', boxWidth: 10, padding: 12, font: { size: 11 } } },
        tooltip: {
          ...TOOLTIP_DEFAULTS,
          callbacks: { label: (ctx) => ` ${ctx.label}: ${((ctx.parsed / total) * 100).toFixed(1)}%` },
        },
      },
      cutout: '65%',
    },
  });
}

// ── P&L bar chart ────────────────────────────────
export function renderPnlChart(holdings) {
  const sorted = holdings
    .filter((h) => state.livePrices[h.ticker])
    .sort((a, b) => {
      const pa = ((state.livePrices[a.ticker] - a.avgBuy) / a.avgBuy) * 100;
      const pb = ((state.livePrices[b.ticker] - b.avgBuy) / b.avgBuy) * 100;
      return pb - pa;
    });

  const labels = sorted.map((h) => h.ticker);
  const data   = sorted.map((h) =>
    parseFloat((((state.livePrices[h.ticker] - h.avgBuy) / h.avgBuy) * 100).toFixed(2))
  );
  const colors = data.map((v) => (v >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'));

  if (state.pnlChartInstance) state.pnlChartInstance.destroy();

  const ctx = document.getElementById('pnlChart').getContext('2d');
  state.pnlChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP_DEFAULTS,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}%` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#55556a', font: { size: 11 } } },
        y: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, callback: (v) => v + '%' } },
      },
    },
  });
}

// ── Drilldown: history chart ─────────────────────
export function renderDrilldownChart(ticker, hist, buyDate, filter) {
  let dates = Object.keys(hist).sort();

  if (filter && filter !== 'ALL') {
    const last = new Date(dates[dates.length - 1]);
    let cutoff;
    if (filter === '3M') { cutoff = new Date(last); cutoff.setMonth(cutoff.getMonth() - 3); }
    else if (filter === '1Y') { cutoff = new Date(last); cutoff.setFullYear(cutoff.getFullYear() - 1); }
    else if (filter === '2Y') { cutoff = new Date(last); cutoff.setFullYear(cutoff.getFullYear() - 2); }
    const cutStr = cutoff.toISOString().split('T')[0];
    dates = dates.filter((d) => d >= cutStr);
  }

  const prices = dates.map((d) => hist[d]);

  if (state.ddChartInstance) state.ddChartInstance.destroy();

  const ctx  = document.getElementById('ddChart').getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, 'rgba(99,102,241,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  state.ddChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        data: prices,
        borderColor: '#6366f1',
        borderWidth: 2,
        backgroundColor: grad,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...TOOLTIP_DEFAULTS, mode: 'index', intersect: false },
      },
      scales: {
        x: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, maxTicksLimit: 8 } },
        y: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, callback: (v) => v.toFixed(0) } },
      },
    },
  });
}

// ── Drilldown: day (intraday) chart ──────────────
export function renderDrilldownDayChart(series, prevClose) {
  const labels = series.map((pt) =>
    new Date(pt.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
  const prices = series.map((pt) => pt.price);
  const base   = prevClose || prices[0];
  const last   = prices[prices.length - 1];
  const chg    = last - base;
  const isUp   = chg >= 0;

  const changeEl = document.getElementById('dd-day-change');
  if (changeEl) {
    changeEl.innerHTML =
      `<span style="color:${colorPnl(chg)};font-weight:700">${isUp ? '+' : ''}${chg.toFixed(2)} (${pct((chg / base) * 100)})</span>` +
      (prevClose ? ` <span style="color:var(--text3)">vs prev close ${prevClose.toFixed(2)}</span>` : '');
  }

  if (state.ddDayChartInstance) state.ddDayChartInstance.destroy();

  const ctx   = document.getElementById('ddDayChart').getContext('2d');
  const color = isUp ? '#22c55e' : '#ef4444';
  const grad  = ctx.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, isUp ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  const datasets = [
    {
      data: prices,
      borderColor: color,
      borderWidth: 2,
      backgroundColor: grad,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0.3,
      label: 'Price',
    },
  ];

  if (prevClose) {
    datasets.push({
      data: prices.map(() => prevClose),
      borderColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
      fill: false,
      label: 'Prev Close',
    });
  }

  state.ddDayChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP_DEFAULTS,
          mode: 'index',
          intersect: false,
          filter: (item) => item.datasetIndex === 0,
          callbacks: { label: (ctx) => ` ₹${ctx.parsed.y.toFixed(2)}` },
        },
      },
      scales: {
        x: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, maxTicksLimit: 8 } },
        y: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, callback: (v) => v.toFixed(0) } },
      },
      interaction: { mode: 'index', intersect: false },
    },
  });
}

// ── Destroy all chart instances ──────────────────
export function destroyAllCharts() {
  ['portfolioChartInstance', 'pieChartInstance', 'pnlChartInstance', 'folioDayChartInstance'].forEach((key) => {
    if (state[key]) { state[key].destroy(); state[key] = null; }
  });
}
