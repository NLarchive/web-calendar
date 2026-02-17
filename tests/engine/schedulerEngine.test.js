import { describe, expect, it } from 'vitest';
import { expandRecurringAppointments, normalizeAppointment, sortAppointments } from '../../src/core/schedulerEngine.js';
import { SORT_MODES } from '../../src/core/constants.js';

describe('schedulerEngine', () => {
  it('normalizes appointment fields', () => {
    const normalized = normalizeAppointment({
      date: '15/02/2026',
      endDate: '15/02/2026',
      title: 'Dog vaccines',
      description: 'Annual dog vaccines',
      location: 'Vet Clinic',
      url: 'https://myvet.com',
      status: 'confirmed',
      attendees: 'owner@example.com,vet@example.com',
      contact: 'myvet.com,12345',
      tags: 'dog,vaccine',
      priority: 9,
    });

    expect(normalized.title).toBe('Dog vaccines');
    expect(normalized.contact).toEqual(['myvet.com', '12345']);
    expect(normalized.tags).toEqual(['dog', 'vaccine']);
    expect(normalized.location).toBe('Vet Clinic');
    expect(normalized.url).toBe('https://myvet.com');
    expect(normalized.attendees).toEqual(['owner@example.com', 'vet@example.com']);
  });

  it('expands yearly recurring appointments in range', () => {
    const item = normalizeAppointment({
      date: '15/02/2025',
      recurrence: 'yearly',
      title: 'Vaccines',
      priority: 8,
    });

    const result = expandRecurringAppointments(
      [item],
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-12-31T23:59:59Z'),
    );

    expect(result.length).toBe(1);
    expect(new Date(result[0].occurrenceDate).getFullYear()).toBe(2026);
  });

  it('sorts by priority when selected', () => {
    const sorted = sortAppointments(
      [
        { title: 'A', priority: 2, date: '2026-02-10T10:00:00.000Z' },
        { title: 'B', priority: 9, date: '2026-02-11T10:00:00.000Z' },
      ],
      SORT_MODES.PRIORITY,
    );

    expect(sorted[0].title).toBe('B');
  });

  it('normalizes recurrence count when provided', () => {
    const normalized = normalizeAppointment({
      date: '2026-02-15T10:00:00',
      title: 'Limited recurring appointment',
      recurrence: 'daily',
      recurrenceCount: '3',
    });

    expect(normalized.recurrenceCount).toBe(3);
  });

  it('limits recurring expansion by recurrence count', () => {
    const item = normalizeAppointment({
      date: '2026-02-15T10:00:00',
      title: 'Limited recurring appointment',
      recurrence: 'daily',
      recurrenceCount: 2,
    });

    const result = expandRecurringAppointments(
      [item],
      new Date('2026-02-14T00:00:00Z'),
      new Date('2026-03-01T23:59:59Z'),
    );

    expect(result.length).toBe(2);
  });

  it('normalizes datetime-local values using selected timezone instead of browser timezone', () => {
    const normalized = normalizeAppointment({
      date: '2026-02-15T10:00',
      endDate: '2026-02-15T11:00',
      timezone: 'Europe/Madrid',
      title: 'Timezone aware appointment',
    });

    expect(normalized.date).toBe('2026-02-15T09:00:00.000Z');
    expect(normalized.endDate).toBe('2026-02-15T10:00:00.000Z');
    expect(normalized.timezone).toBe('Europe/Madrid');
  });
});
