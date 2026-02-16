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
  listRoot: document.getElementById('appointment-list'),
  calendarRoot: document.getElementById('calendar'),
  infoRoot: document.getElementById('info-panel'),
  datetimeRoot: document.getElementById('current-datetime'),
});

app.start();
