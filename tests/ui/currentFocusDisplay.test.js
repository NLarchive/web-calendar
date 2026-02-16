import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App.js';

function createAppDom() {
  document.body.innerHTML = `
    <header id="navbar"></header>
    <div id="appointment-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
      <div class="modal-card">
        <div class="modal-header">
          <h2 id="appointment-modal-title">New Appointment</h2>
          <button id="close-appointment-modal" aria-label="Close new appointment popup">✕</button>
        </div>
        <div id="appointment-form"></div>
      </div>
    </div>
    <div id="appointment-details-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="appointment-details-modal-title">
      <div class="modal-card">
        <div class="modal-header">
          <h2 id="appointment-details-modal-title">Appointment Details</h2>
          <button id="close-appointment-details-modal" aria-label="Close appointment details popup">✕</button>
        </div>
        <div id="appointment-details-content"></div>
      </div>
    </div>
    <div id="sync-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="sync-modal-title">
      <div class="modal-card">
        <div class="modal-header">
          <h2 id="sync-modal-title">Sync Calendar</h2>
          <button id="close-sync-modal" aria-label="Close sync popup">✕</button>
        </div>
        <form id="sync-form"></form>
        <input id="sync-action-label" />
        <select id="sync-format"><option value="json">json</option><option value="ics">ics</option></select>
        <select id="sync-target-app"><option value="download">download</option></select>
      </div>
    </div>
    <div id="appointment-list"></div>
    <section class="panel calendar-panel">
      <div class="panel-header">
        <h2>Calendar</h2>
        <div id="current-datetime" aria-live="polite"></div>
      </div>
      <div id="calendar"></div>
    </section>
    <aside id="info-panel" class="info-panel hidden"></aside>
    <div id="current-datetime"></div>
  `;

  return new App({
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
    datetimeRoot: document.querySelector('#current-datetime'),
  });
}

describe('current focus display in calendar header', () => {
  it('shows month label by default and updates when navigating', () => {
    const app = createAppDom();
    app.bindEventListeners();
    app.render();

    const header = document.querySelector('#current-datetime');
    expect(header.textContent).toMatch(/\w+ \d{4}/); // e.g. "February 2026"

    // switch to year
    document.querySelector('[data-view="year"]').click();
    expect(header.textContent).toMatch(/Year:\s*\d{4}/);

    // switch to day
    document.querySelector('[data-view="day"]').click();
    // Example: "Sun, Feb 15, 2026"
    expect(header.textContent).toMatch(/^[A-Za-z]{3},\s[A-Za-z]{3}\s\d{1,2},\s\d{4}$/);
  });

  it('updates header when using next/prev navigation', () => {
    const app = createAppDom();
    app.bindEventListeners();
    app.render();

    const header = document.querySelector('#current-datetime');
    const initial = header.textContent;

    document.querySelector('[data-action="next"]').click();
    expect(header.textContent).not.toBe(initial);
  });
});