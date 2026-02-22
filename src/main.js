import { App } from './app/App.js';
import { createRepoUpdateMonitor } from './core/repoUpdateMonitor.js';

const app = new App({
  navbarRoot: document.getElementById('navbar'),
  formRoot: document.getElementById('appointment-form'),
  modalRoot: document.getElementById('appointment-modal'),
  closeModalButton: document.getElementById('close-appointment-modal'),
  detailsModalRoot: document.getElementById('appointment-details-modal'),
  closeDetailsModalButton: document.getElementById('close-appointment-details-modal'),
  detailsContentRoot: document.getElementById('appointment-details-content'),
  syncModalRoot: document.getElementById('sync-modal'),
  closeSyncModalButton: document.getElementById('close-sync-modal'),
  syncFormRoot: document.getElementById('sync-form'),
  syncActionLabelRoot: document.getElementById('sync-action-label'),
  syncFormatRoot: document.getElementById('sync-format'),
  syncTargetAppRoot: document.getElementById('sync-target-app'),
  stateLoadModalRoot: document.getElementById('state-load-modal'),
  closeStateLoadModalButton: document.getElementById('close-state-load-modal'),
  stateLoadFormRoot: document.getElementById('state-load-form'),
  stateLoadSourceRoot: document.getElementById('load-state-source'),
  stateLoadSampleFolderRoot: document.getElementById('load-state-sample-folder'),
  stateLoadSampleRoot: document.getElementById('load-state-sample'),
  stateLoadSampleCountryRoot: document.getElementById('load-state-sample-country'),
  stateLoadFileRoot: document.getElementById('load-state-file'),
  sampleStateFieldsRoot: document.getElementById('sample-state-fields'),
  customStateFieldsRoot: document.getElementById('custom-state-fields'),
  listRoot: document.getElementById('appointment-list'),
  calendarRoot: document.getElementById('calendar'),
  infoRoot: document.getElementById('info-panel'),
  datetimeRoot: document.getElementById('current-datetime'),
});

if (typeof window !== 'undefined') {
  window.__APP__ = app;
  window.__MCP_ENDPOINTS__ = {
    listConnectors: () => app.connectorRegistry.list(),
    pullTasks: () => app.connectorRegistry.get('mcp-task-connector')?.pull(),
    pushTasks: (payload) => app.connectorRegistry.get('mcp-task-connector')?.push(payload),
  };
}

app.start();

const repoUpdateMonitor = createRepoUpdateMonitor({
  intervalMs: 45000,
  onRepoUpdate: ({ nextVersion }) => {
    try {
      app.persist();
    } catch {
      // keep update flow resilient
    }

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('appVersion', String(nextVersion || Date.now()));
    window.location.replace(currentUrl.toString());
  },
  onCheckError: (error) => {
    console.warn('Repo update check failed:', error?.message || error);
  },
});

repoUpdateMonitor.start();

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      repoUpdateMonitor.checkForUpdates();
    }
  });
}
