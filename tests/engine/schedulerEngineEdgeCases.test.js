import { describe, expect, it, vi } from 'vitest';
import { normalizeAppointment, expandRecurringAppointments, getRangeByView, sortAppointments } from '../../src/core/schedulerEngine.js';
import { SORT_MODES, RECURRENCE } from '../../src/core/constants.js';

describe('schedulerEngine edge cases', () => {
  describe('normalizeAppointment validation', () => {
    it('throws on invalid date', () => {
      expect(() => normalizeAppointment({ date: 'garbage' })).toThrow('Invalid appointment date');
    });

    it('throws when endDate is before date', () => {
      expect(() =>
        normalizeAppointment({
          date: '2026-02-15T10:00:00.000Z',
          endDate: '2026-02-14T10:00:00.000Z',
        }),
      ).toThrow('End date must be after start date');
    });

    it('defaults empty title to Untitled', () => {
      const result = normalizeAppointment({ date: '2026-02-15T10:00:00.000Z', title: '' });
      expect(result.title).toBe('Untitled');
    });

    it('defaults missing title to Untitled', () => {
      const result = normalizeAppointment({ date: '2026-02-15T10:00:00.000Z' });
      expect(result.title).toBe('Untitled');
    });

    it('clamps priority to range 1-10', () => {
      expect(normalizeAppointment({ date: '2026-02-15', priority: 0 }).priority).toBe(1);
      expect(normalizeAppointment({ date: '2026-02-15', priority: 15 }).priority).toBe(10);
      expect(normalizeAppointment({ date: '2026-02-15', priority: -5 }).priority).toBe(1);
    });

    it('normalizes unknown recurrence to none', () => {
      const result = normalizeAppointment({ date: '2026-02-15', recurrence: 'biweekly' });
      expect(result.recurrence).toBe('none');
    });

    it('normalizes unknown status to confirmed', () => {
      const result = normalizeAppointment({ date: '2026-02-15', status: 'unknown' });
      expect(result.status).toBe('confirmed');
    });

    it('handles non-numeric priority by defaulting to 1', () => {
      const result = normalizeAppointment({ date: '2026-02-15', priority: 'high' });
      expect(result.priority).toBe(1);
    });

    it('treats comma-separated strings as arrays', () => {
      const result = normalizeAppointment({
        date: '2026-02-15',
        tags: 'a, b, c',
        attendees: 'x@y.com, z@w.com',
      });
      expect(result.tags).toEqual(['a', 'b', 'c']);
      expect(result.attendees).toEqual(['x@y.com', 'z@w.com']);
    });
  });

  describe('expandRecurringAppointments safety', () => {
    it('does not expand beyond safety limit', () => {
      const item = normalizeAppointment({
        date: '2000-01-01T00:00:00.000Z',
        recurrence: 'daily',
        title: 'Daily task',
      });

      const result = expandRecurringAppointments(
        [item],
        new Date('2000-01-01'),
        new Date('2099-12-31'),
      );

      // Should be capped at MAX_EXPANSION (1000)
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('returns empty for non-recurring item outside range', () => {
      const item = normalizeAppointment({
        date: '2020-01-01T10:00:00.000Z',
        recurrence: 'none',
        title: 'Past event',
      });

      const result = expandRecurringAppointments(
        [item],
        new Date('2026-01-01'),
        new Date('2026-12-31'),
      );

      expect(result.length).toBe(0);
    });
  });

  describe('getRangeByView', () => {
    const date = new Date('2026-02-15T10:00:00.000Z');

    it('returns day range', () => {
      const [start, end] = getRangeByView(date, 'day');
      expect(start.getDate()).toBe(15);
      expect(end.getDate()).toBe(15);
      expect(end.getHours()).toBe(23);
    });

    it('returns week range spanning 7 days', () => {
      const [start, end] = getRangeByView(date, 'week');
      const diff = (end - start) / (1000 * 60 * 60 * 24);
      expect(diff).toBeGreaterThanOrEqual(6);
      expect(diff).toBeLessThan(7);
    });

    it('returns year range', () => {
      const [start, end] = getRangeByView(date, 'year');
      expect(start.getMonth()).toBe(0);
      expect(end.getMonth()).toBe(11);
    });

    it('defaults to month range for unknown view', () => {
      const [start, end] = getRangeByView(date, 'unknown');
      expect(start.getDate()).toBe(1);
    });
  });

  describe('sortAppointments', () => {
    it('sorts by datetime when DATETIME mode is selected', () => {
      const items = [
        { title: 'Late', priority: 10, date: '2026-02-20T10:00:00.000Z' },
        { title: 'Early', priority: 1, date: '2026-02-10T10:00:00.000Z' },
      ];

      const sorted = sortAppointments(items, SORT_MODES.DATETIME);
      expect(sorted[0].title).toBe('Early');
      expect(sorted[1].title).toBe('Late');
    });

    it('uses date as tiebreaker when priorities match', () => {
      const items = [
        { title: 'B', priority: 5, date: '2026-02-20T10:00:00.000Z' },
        { title: 'A', priority: 5, date: '2026-02-10T10:00:00.000Z' },
      ];

      const sorted = sortAppointments(items, SORT_MODES.PRIORITY);
      expect(sorted[0].title).toBe('A'); // earlier date first when priority ties
    });
  });
});
