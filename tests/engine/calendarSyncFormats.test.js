import { describe, expect, it } from 'vitest';
import {
  getPreferredFormatForTargetApp,
  parseStateFromCSV,
  parseStateFromICS,
  parseStateFromJson,
  stateToCSV,
  stateToICS,
  stateToJson,
} from '../../src/modules/sync/calendarSyncFormats.js';

const sampleState = {
  appointments: [
    {
      id: 'a1',
      date: '2026-02-15T10:00:00.000Z',
      recurrence: 'yearly',
      title: 'Dog vaccine booster',
      description: 'Annual vet visit',
      endDate: '2026-02-15T11:00:00.000Z',
      location: 'Central Vet Clinic',
      url: 'https://myvet.com/bookings/1',
      status: 'confirmed',
      contact: ['https://myvet.com'],
      attendees: ['owner@example.com', 'vet@example.com'],
      category: 'dog',
      tags: ['vaccine', 'dog'],
      priority: 9,
      createdAt: '2026-02-15T00:00:00.000Z',
    },
  ],
  viewMode: 'month',
  sortMode: 'priority',
  focusDate: '2026-02-01T00:00:00.000Z',
};

describe('calendar sync formats', () => {
  it('serializes and parses JSON state', () => {
    const json = stateToJson(sampleState);
    const parsed = parseStateFromJson(json);

    expect(parsed.appointments.length).toBe(1);
    expect(parsed.appointments[0].title).toBe('Dog vaccine booster');
  });

  it('serializes to ICS and parses back core fields', () => {
    const ics = stateToICS(sampleState);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Dog vaccine booster');

    const parsed = parseStateFromICS(ics);
    expect(parsed.appointments.length).toBe(1);
    expect(parsed.appointments[0].title).toBe('Dog vaccine booster');
    expect(parsed.appointments[0].recurrence).toBe('yearly');
    expect(parsed.appointments[0].location).toBe('Central Vet Clinic');
    expect(parsed.appointments[0].status).toBe('confirmed');
    expect(parsed.appointments[0].attendees).toContain('owner@example.com');
  });

  it('serializes and parses CSV state', () => {
    const csv = stateToCSV(sampleState);
    expect(csv).toContain('id,date,endDate,recurrence,title');
    expect(csv).toContain('Dog vaccine booster');

    const parsed = parseStateFromCSV(csv);
    expect(parsed.appointments.length).toBe(1);
    expect(parsed.appointments[0].location).toBe('Central Vet Clinic');
    expect(parsed.appointments[0].attendees).toEqual(['owner@example.com', 'vet@example.com']);
  });

  it('picks best export format for known calendar apps', () => {
    expect(getPreferredFormatForTargetApp('google')).toBe('ics');
    expect(getPreferredFormatForTargetApp('outlook')).toBe('ics');
    expect(getPreferredFormatForTargetApp('download')).toBe('json');
  });
});
