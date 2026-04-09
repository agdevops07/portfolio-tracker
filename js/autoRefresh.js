// ═══════════════════════════════════════════════
// AUTO REFRESH
// Manages the periodic price refresh timer.
// ═══════════════════════════════════════════════

import { state } from './state.js';
import { showToast } from './utils.js';

let onRefreshCallback = null;

export function initAutoRefresh(callback) {
  onRefreshCallback = callback;
}

export function startAutoRefresh() {
  stopAutoRefresh();
  if (!state.autoRefresh) return;
  state.refreshTimer = setInterval(() => {
    if (onRefreshCallback) onRefreshCallback();
  }, state.refreshInterval * 1000);
  _updateIndicator();
}

export function stopAutoRefresh() {
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }
}

export function toggleAutoRefresh() {
  state.autoRefresh = !state.autoRefresh;
  const btn = document.getElementById('ar-toggle');
  const indicator = document.getElementById('refresh-indicator');
  if (state.autoRefresh) {
    startAutoRefresh();
    if (btn) btn.textContent = 'Pause';
    if (indicator) indicator.classList.remove('paused');
    showToast('Auto-refresh enabled');
  } else {
    stopAutoRefresh();
    if (btn) btn.textContent = 'Resume';
    if (indicator) indicator.classList.add('paused');
    showToast('Auto-refresh paused');
  }
}

export function updateRefreshInterval() {
  const sel = document.getElementById('refresh-interval');
  if (!sel) return;
  state.refreshInterval = parseInt(sel.value, 10);
  if (state.autoRefresh) startAutoRefresh();
  showToast(`Auto-refresh set to every ${state.refreshInterval}s`);
}

export function updateLastUpdatedLabel() {
  if (!state.lastUpdated) return;
  const el = document.getElementById('last-updated-label');
  if (!el) return;
  const t = state.lastUpdated;
  el.textContent = 'Updated ' + t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function _updateIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  const btn = document.getElementById('ar-toggle');
  if (indicator) indicator.classList.remove('paused');
  if (btn) btn.textContent = 'Pause';
}
