import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App.js';

function setupLoadStateDom() {
  document.body.innerHTML = `
    <header id="navbar"></header>
    <div id="state-load-modal" class="modal hidden">
      <form id="state-load-form">
        <select id="load-state-source">
          <option value="sample" selected>Sample State</option>
          <option value="custom">Custom State</option>
          <option value="empty">Empty State</option>
        </select>
        <div id="sample-state-fields">
          <select id="load-state-sample-folder">
            <option value="vet">Veterinary Care</option>
          </select>
          <select id="load-state-sample">
            <option value="dog-vet-care-state.json">Dog</option>
          </select>
          <select id="load-state-sample-country">
            <option value="global">Global (WHO/NICE/ACOG)</option>
            <option value="chile">Chile (MINSAL/Local Guidance)</option>
          </select>
        </div>
        <div id="custom-state-fields" class="hidden">
          <input id="load-state-file" type="file" />
        </div>
        <button type="submit">Load State</button>
      </form>
      <button id="close-state-load-modal">x</button>
    </div>
    <div id="appointment-form"></div>
    <div id="appointment-list"></div>
    <div id="calendar"></div>
    <div id="info-panel"></div>
    <div id="current-datetime"></div>
  `;

  return new App({
    navbarRoot: document.getElementById('navbar'),
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
    formRoot: document.getElementById('appointment-form'),
    listRoot: document.getElementById('appointment-list'),
    calendarRoot: document.getElementById('calendar'),
    infoRoot: document.getElementById('info-panel'),
    datetimeRoot: document.getElementById('current-datetime'),
  });
}

describe('state loading', () => {
  it('loads sample from local data through Load State modal', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sampleMeta: { country: 'chile' },
          appointments: [{ id: 'sample', title: 'Sample Apt', date: '2026-02-15T10:00:00.000Z' }],
          viewMode: 'month',
          sortMode: 'priority',
          focusDate: '2026-02-15T00:00:00.000Z',
        }),
      })
    );
    global.fetch = mockFetch;

    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
      configurable: true,
    });

    window.confirm = vi.fn(() => true);

    const app = setupLoadStateDom();
    app.bindEventListeners();

    const form = document.getElementById('state-load-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('./data/calendar-template/vet/dog-vet-care-state.json');
    expect(app.state.appointments.length).toBe(1);
    expect(app.state.appointments[0].title).toBe('Sample Apt');
    expect(document.getElementById('load-state-sample-country').value).toBe('chile');
  });

  it('loads sample from GitHub when on GitHub Pages', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sampleMeta: { country: 'chile' },
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
      configurable: true,
    });

    window.confirm = vi.fn(() => true);

    const app = setupLoadStateDom();
    app.bindEventListeners();

    const form = document.getElementById('state-load-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(mockFetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/NLarchive/web-calendar/main/data/calendar-template/vet/dog-vet-care-state.json');
  });

  it('does not replace state when user cancels warning prompt', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    window.confirm = vi.fn(() => false);

    const app = setupLoadStateDom();
    app.bindEventListeners();

    // Ignore background metadata lookup performed when sample dropdown initializes.
    mockFetch.mockClear();

    const form = document.getElementById('state-load-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
