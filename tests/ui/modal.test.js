import { describe, it, expect } from 'vitest';
import { App } from '../../src/app/App.js';

describe('appointment modal', () => {
  it('opens from navbar and closes via close button and form submit', async () => {
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
      <div id="appointment-list"></div>
      <div id="calendar"></div>
      <div id="info-panel" class="info-panel hidden"></div>
      <div id="appointment-details-modal" class="modal hidden"><div id="appointment-details-content"></div><button id="close-appointment-details-modal">x</button></div>
      <div id="current-datetime"></div>
    `;

    const app = new App({
      navbarRoot: document.getElementById('navbar'),
      formRoot: document.getElementById('appointment-form'),
      modalRoot: document.getElementById('appointment-modal'),
      closeModalButton: document.getElementById('close-appointment-modal'),
      detailsModalRoot: document.getElementById('appointment-details-modal'),
      closeDetailsModalButton: document.getElementById('close-appointment-details-modal'),
      detailsContentRoot: document.getElementById('appointment-details-content'),
      listRoot: document.getElementById('appointment-list'),
      calendarRoot: document.getElementById('calendar'),
      infoRoot: document.getElementById('info-panel'),
      datetimeRoot: document.getElementById('current-datetime'),
    });

    // render UI and attach handlers (avoid start() to prevent intervals)
    app.bindEventListeners();
    app.render();

    const openBtn = document.querySelector('[data-action="open-new-appointment"]');
    expect(openBtn).toBeTruthy();

    // Open modal
    openBtn.click();
    expect(app.roots.modalRoot.classList.contains('hidden')).toBe(false);

    // Close via close button
    document.getElementById('close-appointment-modal').click();
    expect(app.roots.modalRoot.classList.contains('hidden')).toBe(true);

    // Open again and submit form -> should close after submit
    openBtn.click();
    expect(app.roots.modalRoot.classList.contains('hidden')).toBe(false);

    const form = document.querySelector('#appointment-form form');
    form.querySelector('input[name="title"]').value = 'Modal Test';
    form.querySelector('input[name="date"]').value = '2026-02-15T10:00';
    form.querySelector('input[name="priority"]').value = '5';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // handler is async — wait a macrotask for modal close to occur
    await new Promise((r) => setTimeout(r, 0));

    expect(app.roots.modalRoot.classList.contains('hidden')).toBe(true);
  });
});
