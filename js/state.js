// ═══════════════════════════════════════════════
// STATE
// Central store — import and mutate directly.
// ═══════════════════════════════════════════════

export const state = {
  rawRows: [],
  holdings: {},
  priceCache: {},
  historyCache: {},
  dayHistoryCache: {},
  portfolioTimeSeries: [],
  fullTimeSeries: [],
  currentFilter: '1Y',
  portfolioChartInstance: null,
  pieChartInstance: null,
  pnlChartInstance: null,
  ddChartInstance: null,
  ddDayChartInstance: null,
  portfolioDayChartInstance: null,
  livePrices: {},
  prevClosePrices: {},
  histories: {},
  dayHistories: {},
  previewSort: {
    key: 'invested',
    asc: false,
  },
  refreshIntervalId: null,
  refreshIntervalMs: 60000,
  refreshPaused: false,
};

export function resetCaches() {
  state.priceCache = {};
  state.livePrices = {};
  state.prevClosePrices = {};
  state.dayHistoryCache = {};
  state.dayHistories = {};
}

export function resetAllCaches() {
  state.priceCache = {};
  state.historyCache = {};
  state.dayHistoryCache = {};
  state.livePrices = {};
  state.prevClosePrices = {};
  state.fullTimeSeries = [];
  state.dayHistories = {};
}
