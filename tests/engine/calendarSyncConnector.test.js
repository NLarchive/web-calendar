import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarSyncConnector } from '../../src/connectors/calendarSyncConnector.js';

describe('calendarSyncConnector', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('exports JSON payload with download target', async () => {
    const connector = new CalendarSyncConnector();

    const result = await connector.push({
      state: { appointments: [{ id: '1', title: 'A', date: '2026-02-15T10:00:00.000Z' }] },
      format: 'json',
      targetApp: 'download',
    });

    expect(result.ok).toBe(true);
    expect(result.format).toBe('json');
  });

  it('exports ICS payload and opens provider helper page', async () => {
    const connector = new CalendarSyncConnector();

    const result = await connector.push({
      state: { appointments: [{ id: '1', title: 'A', date: '2026-02-15T10:00:00.000Z', recurrence: 'none' }] },
      format: 'auto',
      targetApp: 'google',
    });

    expect(result.ok).toBe(true);
    expect(result.format).toBe('ics');
    expect(window.open).toHaveBeenCalled();
  });

  it('exports CSV payload when csv format is selected', async () => {
    const connector = new CalendarSyncConnector();

    const result = await connector.push({
      state: { appointments: [{ id: '1', title: 'A', date: '2026-02-15T10:00:00.000Z' }] },
      format: 'csv',
      targetApp: 'download',
    });

    expect(result.ok).toBe(true);
    expect(result.format).toBe('csv');
  });
});
