import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App.js';

describe('sample loading', () => {
  it('loads sample from local data when not on GitHub Pages', async () => {
    // Mock fetch
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          appointments: [{ id: 'sample', title: 'Sample Apt', date: '2026-02-15T10:00:00.000Z' }],
          viewMode: 'month',
          sortMode: 'priority',
          focusDate: '2026-02-15T00:00:00.000Z',
        }),
      })
    );
    global.fetch = mockFetch;

    // Mock location
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
    });

    document.body.innerHTML = `
      <header id="navbar"></header>
      <div id="sample-modal" class="modal hidden">
        <form id="sample-form">
          <select id="sample-select">
            <option value="empty-calendar-state.json">Empty</option>
          </select>
          <button type="submit">Load</button>
        </form>
        <button id="close-sample-modal">x</button>
      </div>
      <div id="appointment-form"></div>
      <div id="appointment-list"></div>
      <div id="calendar"></div>
      <div id="info-panel"></div>
      <div id="current-datetime"></div>
    `;

    const app = new App({
      navbarRoot: document.getElementById('navbar'),
      sampleModalRoot: document.getElementById('sample-modal'),
      closeSampleModalButton: document.getElementById('close-sample-modal'),
      sampleFormRoot: document.getElementById('sample-form'),
      sampleSelectRoot: document.getElementById('sample-select'),
      formRoot: document.getElementById('appointment-form'),
      listRoot: document.getElementById('appointment-list'),
      calendarRoot: document.getElementById('calendar'),
      infoRoot: document.getElementById('info-panel'),
      datetimeRoot: document.getElementById('current-datetime'),
    });

    app.bindEventListeners();

    // Simulate form submit
    const form = document.getElementById('sample-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Wait for async
    await new Promise((r) => setTimeout(r, 0));

    expect(mockFetch).toHaveBeenCalledWith('./data/empty-calendar-state.json');
    expect(app.state.appointments.length).toBe(1);
    expect(app.state.appointments[0].title).toBe('Sample Apt');
  });

  it('loads sample from GitHub when on GitHub Pages', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          appointments: [],
          viewMode: 'month',
          sortMode: 'priority',
          focusDate: null,
        }),
      })
    );
    global.fetch = mockFetch;

    Object.defineProperty(window, 'location', {
      value: { hostname: 'nlarchive.github.io' },
      writable: true,
    });

    document.body.innerHTML = `
      <div id="sample-modal" class="modal hidden">
        <form id="sample-form">
          <select id="sample-select">
            <option value="empty-calendar-state.json">Empty</option>
          </select>
        </form>
      </div>
      <div id="appointment-form"></div>
    `;

    const app = new App({
      sampleModalRoot: document.getElementById('sample-modal'),
      sampleFormRoot: document.getElementById('sample-form'),
      sampleSelectRoot: document.getElementById('sample-select'),
      formRoot: document.getElementById('appointment-form'),
    });

    app.bindEventListeners();

    const form = document.getElementById('sample-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((r) => setTimeout(r, 0));

    expect(mockFetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/NLarchive/web-calendar/main/data/empty-calendar-state.json');
  });
});
