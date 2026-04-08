// ═══════════════════════════════════════════════
// STATE
// Central store — import and mutate directly.
// ═══════════════════════════════════════════════

export const state = {
  rawRows: [],
  holdings: {},
  priceCache: {},
  historyCache: {},
  portfolioTimeSeries: [],
  fullTimeSeries: [],
  currentFilter: '1Y',
  portfolioChartInstance: null,
  pieChartInstance: null,
  pnlChartInstance: null,
  ddChartInstance: null,
  livePrices: {},
  histories: {},
  previewSort: {
    key: 'invested',
    asc: false,
  },
};

export function resetCaches() {
  state.priceCache = {};
  state.historyCache = {};
  state.livePrices = {};
  state.fullTimeSeries = [];
}
