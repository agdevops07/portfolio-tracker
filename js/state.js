// ═══════════════════════════════════════════════
// STATE
// Central store — import and mutate directly.
// ═══════════════════════════════════════════════

export const state = {
  rawRows: [],
  holdings: {},
  priceCache: {},
  historyCache: {},
  dayChartCache: {},
  portfolioTimeSeries: [],
  fullTimeSeries: [],
  currentFilter: '1Y',
  ddHistoryFilter: '1Y',
  currentDDTicker: null,
  currentDDTab: 'day',
  portfolioChartInstance: null,
  pieChartInstance: null,
  pnlChartInstance: null,
  ddChartInstance: null,
  ddDayChartInstance: null,
  folioDayChartInstance: null,
  livePrices: {},
  prevClosePrices: {},
  histories: {},
  autoRefresh: true,
  refreshInterval: 60,       // seconds
  refreshTimer: null,
  lastUpdated: null,
  previewSort: {
    key: 'invested',
    asc: false,
  },
};

export function resetCaches() {
  state.priceCache = {};
  state.historyCache = {};
  state.dayChartCache = {};
  state.livePrices = {};
  state.prevClosePrices = {};
  state.fullTimeSeries = [];
}

export function resetPriceCache() {
  state.priceCache = {};
  state.dayChartCache = {};
}
