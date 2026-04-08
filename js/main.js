// ═══════════════════════════════════════════════
// MAIN
// Bootstrap: wire everything up on DOMContentLoaded.
// ═══════════════════════════════════════════════

import { initFileHandlers, loadSampleData, loadMyPortfolio } from './fileHandler.js';
import { sortPreview, showPreview } from './preview.js';
import { loadDashboard, refreshDashboard } from './dashboard.js';
import { setTimeFilter } from './charts.js';
import { goBack, showDashboard } from './utils.js';
import { exportChart } from './export.js';
import { openDrilldown } from './drilldown.js';

document.addEventListener('DOMContentLoaded', () => {
  // File handling
  initFileHandlers();

  // Expose to HTML onclick handlers
  window.loadSampleData = loadSampleData;
  window.loadMyPortfolio = loadMyPortfolio;
  window.loadDashboard = loadDashboard;
  window.refreshDashboard = refreshDashboard;
  window.goBack = goBack;
  window.showDashboard = showDashboard;
  window.sortPreview = sortPreview;
  window.setTimeFilter = setTimeFilter;
  window.exportChart = exportChart;
  window.openDrilldown = openDrilldown;
});
