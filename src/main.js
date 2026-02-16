import { App } from './app/App.js';

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
  stateLoadSampleRoot: document.getElementById('load-state-sample'),
  stateLoadFileRoot: document.getElementById('load-state-file'),
  sampleStateFieldsRoot: document.getElementById('sample-state-fields'),
  customStateFieldsRoot: document.getElementById('custom-state-fields'),
  listRoot: document.getElementById('appointment-list'),
  calendarRoot: document.getElementById('calendar'),
  infoRoot: document.getElementById('info-panel'),
  datetimeRoot: document.getElementById('current-datetime'),
});

app.start();
