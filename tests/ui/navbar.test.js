import { describe, expect, it, vi } from 'vitest';
import { renderNavbar } from '../../src/modules/ui/navbar.js';

describe('navbar grouped controls', () => {
  function buildHandlers() {
    return {
      onOpenNewAppointment: vi.fn(),
      onOpenCalculator: vi.fn(),
      onOpenSyncApp: vi.fn(),
      onPrev: vi.fn(),
      onToday: vi.fn(),
      onNext: vi.fn(),
      onViewChange: vi.fn(),
      onToggleSort: vi.fn(),
      onSaveState: vi.fn(),
      onOpenLoadState: vi.fn(),
      onToggleInfo: vi.fn(),
      onSearchChange: vi.fn(),
      onFilterStatusChange: vi.fn(),
      onFilterCalendarChange: vi.fn(),
      onFilterFromDateChange: vi.fn(),
      onFilterToDateChange: vi.fn(),
    };
  }

  it('renders grouped dropdown sections for actions and filters', () => {
    const root = document.createElement('div');
    const handlers = buildHandlers();

    renderNavbar(
      root,
      {
        viewMode: 'month',
        sortMode: 'priority',
        calendars: [
          { id: 'default', name: 'Default', color: '#2563eb' },
          { id: 'work', name: 'Work', color: '#7c3aed' },
        ],
        filters: {
          query: '',
          status: 'all',
          calendarId: 'all',
          fromDate: '',
          toDate: '',
        },
      },
      handlers,
    );

    expect(root.querySelector('details[data-group="actions"]')).toBeTruthy();
    expect(root.querySelector('details[data-group="filters"]')).toBeTruthy();
    const searchEl = root.querySelector('[data-action="search"]');
    expect(searchEl).toBeTruthy();
    expect(searchEl.getAttribute('name')).toBe('search');

    const statusEl = root.querySelector('[data-action="filter-status"]');
    expect(statusEl).toBeTruthy();
    expect(statusEl.getAttribute('name')).toBe('filterStatus');

    const calendarEl = root.querySelector('[data-action="filter-calendar"]');
    expect(calendarEl).toBeTruthy();
    expect(calendarEl.getAttribute('name')).toBe('filterCalendar');

    expect(root.querySelector('[data-action="filter-from-date"]')).toBeTruthy();
    expect(root.querySelector('[data-action="filter-to-date"]')).toBeTruthy();
  });

  it('fires filter and view handlers when controls change', () => {
    const root = document.createElement('div');
    const handlers = buildHandlers();

    renderNavbar(
      root,
      {
        viewMode: 'month',
        sortMode: 'priority',
        calendars: [{ id: 'default', name: 'Default', color: '#2563eb' }],
        filters: {
          query: '',
          status: 'all',
          calendarId: 'all',
          fromDate: '',
          toDate: '',
        },
      },
      handlers,
    );

    const search = root.querySelector('[data-action="search"]');
    search.value = 'vet';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    const status = root.querySelector('[data-action="filter-status"]');
    status.value = 'tentative';
    status.dispatchEvent(new Event('change', { bubbles: true }));

    const view = root.querySelector('[data-action="view-mode"]');
    view.value = 'week';
    view.dispatchEvent(new Event('change', { bubbles: true }));

    expect(handlers.onSearchChange).toHaveBeenCalledWith('vet');
    expect(handlers.onFilterStatusChange).toHaveBeenCalledWith('tentative');
    expect(handlers.onViewChange).toHaveBeenCalledWith('week');
  });

  it('closes open group when clicking outside navbar', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const handlers = buildHandlers();

    renderNavbar(
      root,
      {
        viewMode: 'month',
        sortMode: 'priority',
        calendars: [{ id: 'default', name: 'Default', color: '#2563eb' }],
        filters: {
          query: '',
          status: 'all',
          calendarId: 'all',
          fromDate: '',
          toDate: '',
        },
      },
      handlers,
    );

    const filters = root.querySelector('details[data-group="filters"]');
    filters.open = true;
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(filters.open).toBe(false);
  });
});
