// ═══════════════════════════════════════════════
// CHARTS
// All Chart.js instances live here.
// ═══════════════════════════════════════════════

import { state } from './state.js';
import { filterTimeSeries } from './timeSeries.js';

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

// ── Portfolio history line chart ─────────────────
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
  document.querySelectorAll('.tf-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  renderPortfolioChart(filter);
}

// ── Portfolio Day Chart ──────────────────────────
export function renderPortfolioDayChart() {
  const canvas = document.getElementById('portfolioDayChart');
  if (!canvas) return;

  // Aggregate day values across all holdings
  const holdings = Object.values(state.holdings);
  const timeMap = {};

  holdings.forEach((h) => {
    const dayData = state.dayHistories[h.ticker];
    if (!dayData || !dayData.length) return;
    dayData.forEach(({ time, price }) => {
      if (!timeMap[time]) timeMap[time] = 0;
      timeMap[time] += price * h.totalQty;
    });
  });

  const sortedTimes = Object.keys(timeMap).sort();
  if (!sortedTimes.length) {
    canvas.parentElement.innerHTML = '<div style="color:var(--text2);text-align:center;padding:2rem;font-size:13px;">Day chart data unavailable</div>';
    return;
  }

  const labels = sortedTimes;
  const values = sortedTimes.map((t) => Math.round(timeMap[t]));

  const isUp = values.length > 1 && values[values.length - 1] >= values[0];
  const color = isUp ? '#22c55e' : '#ef4444';

  if (state.portfolioDayChartInstance) state.portfolioDayChartInstance.destroy();

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  state.portfolioDayChartInstance = new Chart(ctx, {
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
        pointHoverRadius: 4,
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
        x: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, maxTicksLimit: 6 } },
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
  const data = filtered.map((h) => state.livePrices[h.ticker] * h.totalQty);
  const labels = filtered.map((h) => h.ticker);
  const total = data.reduce((a, b) => a + b, 0);

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
  const data = sorted.map((h) =>
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

// ── Drilldown price history chart ────────────────
export function renderDrilldownChart(ticker, hist, buyDate) {
  const dates = Object.keys(hist).sort();
  const prices = dates.map((d) => hist[d]);

  if (state.ddChartInstance) state.ddChartInstance.destroy();

  const ctx = document.getElementById('ddChart').getContext('2d');
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
        tooltip: {
          ...TOOLTIP_DEFAULTS,
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, maxTicksLimit: 8 } },
        y: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, callback: (v) => v.toFixed(0) } },
      },
    },
  });
}

// ── Drilldown day chart ───────────────────────────
export function renderDrilldownDayChart(ticker) {
  const canvas = document.getElementById('ddDayChart');
  if (!canvas) return;

  const dayData = state.dayHistories[ticker] || [];
  if (!dayData.length) {
    canvas.parentElement.innerHTML = '<div style="color:var(--text2);text-align:center;padding:1.5rem;font-size:13px;">Day chart data unavailable</div>';
    return;
  }

  const labels = dayData.map((d) => d.time);
  const prices = dayData.map((d) => d.price);

  const isUp = prices.length > 1 && prices[prices.length - 1] >= prices[0];
  const color = isUp ? '#22c55e' : '#ef4444';

  if (state.ddDayChartInstance) state.ddDayChartInstance.destroy();

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  state.ddDayChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: prices,
        borderColor: color,
        borderWidth: 2,
        backgroundColor: grad,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
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
        },
      },
      scales: {
        x: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, maxTicksLimit: 6 } },
        y: { ...AXIS_DEFAULTS, ticks: { ...AXIS_DEFAULTS.ticks, callback: (v) => v.toFixed(2) } },
      },
    },
  });
}

// ── Destroy all chart instances ──────────────────
export function destroyAllCharts() {
  ['portfolioChartInstance', 'pieChartInstance', 'pnlChartInstance', 'portfolioDayChartInstance'].forEach((key) => {
    if (state[key]) { state[key].destroy(); state[key] = null; }
  });
}
