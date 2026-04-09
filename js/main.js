// ═══════════════════════════════════════════════
// MAIN
// Bootstrap: wire everything up on DOMContentLoaded.
// ═══════════════════════════════════════════════

import { initFileHandlers, loadSampleData, loadMyPortfolio } from './fileHandler.js';
import { sortPreview } from './preview.js';
import { loadDashboard, refreshDashboard, refreshPricesOnly } from './dashboard.js';
import { setTimeFilter } from './charts.js';
import { goBack, showDashboard } from './utils.js';
import { exportChart } from './export.js';
import { openDrilldown, switchTab, setDDHistoryFilter } from './drilldown.js';
import { toggleAutoRefresh, updateRefreshInterval } from './autoRefresh.js';

document.addEventListener('DOMContentLoaded', () => {
  initFileHandlers();

  window.loadSampleData       = loadSampleData;
  window.loadMyPortfolio      = loadMyPortfolio;
  window.loadDashboard        = loadDashboard;
  window.refreshDashboard     = refreshDashboard;
  window.refreshPricesOnly    = refreshPricesOnly;
  window.goBack               = goBack;
  window.showDashboard        = showDashboard;
  window.sortPreview          = sortPreview;
  window.setTimeFilter        = setTimeFilter;
  window.exportChart          = exportChart;
  window.openDrilldown        = openDrilldown;
  window.switchTab            = switchTab;
  window.setDDHistoryFilter   = setDDHistoryFilter;
  window.toggleAutoRefresh    = toggleAutoRefresh;
  window.updateRefreshInterval = updateRefreshInterval;
});
