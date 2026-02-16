import { describe, expect, it, vi } from 'vitest';
import {
  CALCULATOR_IMPORT_STORAGE_KEY,
  CalendarCalculatorPlugin,
  queueCalendarCalculatorImport,
} from '../../src/plugins/calendarCalculatorPlugin.js';

describe('calendarCalculatorPlugin', () => {
  it('queues import payload in localStorage', () => {
    localStorage.removeItem(CALCULATOR_IMPORT_STORAGE_KEY);

    const ok = queueCalendarCalculatorImport({
      appointments: [
        {
          date: new Date().toISOString(),
          title: 'Queued from calculator',
          priority: 5,
        },
      ],
    });

    expect(ok).toBe(true);
    expect(localStorage.getItem(CALCULATOR_IMPORT_STORAGE_KEY)).toContain('Queued from calculator');
  });

  it('consumes queued payload and applies merged state', () => {
    const plugin = new CalendarCalculatorPlugin();
    const applyLoadedState = vi.fn();

    const payload = {
      appointments: [
        {
          id: 'calc-1',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          title: 'Calculated check',
          priority: 6,
        },
      ],
      calendars: [{ id: 'health', name: 'Health', color: '#059669' }],
    };

    localStorage.setItem(CALCULATOR_IMPORT_STORAGE_KEY, JSON.stringify(payload));

    plugin.onAppReady({
      app: {
        state: {
          appointments: [],
          calendars: [],
          viewMode: 'month',
          sortMode: 'priority',
        },
        applyLoadedState,
      },
    });

    expect(applyLoadedState).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(CALCULATOR_IMPORT_STORAGE_KEY)).toBeNull();
  });
});
