import { App } from './app/App.js';
import { createRepoUpdateMonitor } from './core/repoUpdateMonitor.js';
import {
  applyStaticTranslations,
  initializeLanguage,
  onLanguageChange,
  t,
} from './i18n/index.js';

initializeLanguage();
applyStaticTranslations(document);
if (typeof document !== 'undefined') {
  document.title = t('app.title');
}

function getElement(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`Missing DOM element: #${id}`);
  return el;
}

const app = new App({
  navbarRoot: getElement('navbar'),
  formRoot: getElement('appointment-form'),
  modalRoot: getElement('appointment-modal'),
  closeModalButton: getElement('close-appointment-modal'),
  detailsModalRoot: getElement('appointment-details-modal'),
  closeDetailsModalButton: getElement('close-appointment-details-modal'),
  detailsContentRoot: getElement('appointment-details-content'),
  syncModalRoot: getElement('sync-modal'),
  closeSyncModalButton: getElement('close-sync-modal'),
  syncFormRoot: getElement('sync-form'),
  syncActionLabelRoot: getElement('sync-action-label'),
  syncFormatRoot: getElement('sync-format'),
  syncTargetAppRoot: getElement('sync-target-app'),
  stateLoadModalRoot: getElement('state-load-modal'),
  closeStateLoadModalButton: getElement('close-state-load-modal'),
  stateLoadFormRoot: getElement('state-load-form'),
  stateLoadSourceRoot: getElement('load-state-source'),
  stateLoadSampleFolderRoot: getElement('load-state-sample-folder'),
  stateLoadSampleRoot: getElement('load-state-sample'),
  stateLoadSampleCountryRoot: getElement('load-state-sample-country'),
  stateLoadFileRoot: getElement('load-state-file'),
  sampleStateFieldsRoot: getElement('sample-state-fields'),
  customStateFieldsRoot: getElement('custom-state-fields'),
  listRoot: getElement('appointment-list'),
  calendarRoot: getElement('calendar'),
  infoRoot: getElement('info-panel'),
  datetimeRoot: getElement('current-datetime'),
  toggleMonthRotateButton: getElement('toggle-month-rotate'),
});

if (typeof window !== 'undefined') {
  window.__APP__ = app;
}

try {
  app.start();
} catch (err) {
  console.error('App initialization failed:', err);
  const calendarRoot = document.getElementById('calendar');
  if (calendarRoot) {
    calendarRoot.innerHTML = '<p style="padding:1rem;color:red;">Application failed to start. Please reload the page.</p>';
  }
}

onLanguageChange(() => {
  applyStaticTranslations(document);
  if (typeof document !== 'undefined') {
    document.title = t('app.title');
  }
  app.render();
});

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
