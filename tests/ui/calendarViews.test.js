import { describe, expect, it } from 'vitest';
import { renderMonthView } from '../../src/modules/calendar/views/monthView.js';
import { renderWeekView } from '../../src/modules/calendar/views/weekView.js';
import { renderYearView } from '../../src/modules/calendar/views/yearView.js';
import { renderDayView } from '../../src/modules/calendar/views/dayView.js';

const sampleItem = {
  id: '1',
  date: '2026-02-15T10:00:00.000Z',
  occurrenceDate: '2026-02-15T10:00:00.000Z',
  title: 'Vet Check',
  description: 'Annual visit',
  category: 'health',
  priority: 9,
  uiKey: '1::2026-02-15T10:00:00.000Z',
};

describe('calendar views render correctly', () => {
  it('monthView includes weekday headers', () => {
    const html = renderMonthView([sampleItem], new Date('2026-02-15'));
    expect(html).toContain('Mon');
    expect(html).toContain('Tue');
    expect(html).toContain('Sun');
    expect(html).toContain('Vet Check');
  });

  it('monthView pads leading empty cells for correct alignment', () => {
    // Use local-time constructor so month is always February regardless of timezone
    const html = renderMonthView([], new Date(2026, 1, 1));
    const emptyCount = (html.match(/month-cell-blank/g) || []).length;
    // Feb 1 2026 is Sunday → (0+6)%7 = 6 blanks when Mon is first column
    expect(emptyCount).toBe(6);
  });

  it('weekView renders 7 day columns', () => {
    const html = renderWeekView([sampleItem], new Date('2026-02-09'));
    const dayCount = (html.match(/calendar-day/g) || []).length;
    expect(dayCount).toBe(7);
  });

  it('yearView renders 12 month blocks', () => {
    const html = renderYearView([sampleItem], new Date('2026-02-15'));
    const monthCount = (html.match(/year-month/g) || []).length;
    expect(monthCount).toBe(12);
  });

  it('dayView renders empty message when no items', () => {
    const html = renderDayView([]);
    expect(html).toContain('No appointments');
  });

  it('dayView renders items with appointment keys', () => {
    const html = renderDayView([sampleItem]);
    expect(html).toContain('data-appointment-key');
    expect(html).toContain('Vet Check');
  });

  it('monthView marks current day with today highlight class', () => {
    const now = new Date();
    const html = renderMonthView([], now);
    expect(html).toContain('month-cell-today');
  });
});
