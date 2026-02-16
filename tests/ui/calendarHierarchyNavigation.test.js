import { describe, expect, it, vi } from 'vitest';
import { CalendarController } from '../../src/modules/calendar/calendarController.js';

const baseAppointment = {
  id: '1',
  date: '2026-02-15T10:00:00',
  recurrence: 'none',
  title: 'Vet Check',
  description: 'Annual visit',
  contact: ['clinic@example.com'],
  category: 'health',
  tags: ['vet'],
  priority: 9,
  createdAt: '2026-02-15T00:00:00',
};

describe('calendar hierarchy navigation', () => {
  it.each([
    ['year', 'month', '.year-month'],
    ['month', 'week', '.month-cell'],
    ['week', 'day', '.calendar-day'],
  ])('navigates from %s to %s when hierarchy cell is clicked', (viewMode, expectedTarget, selector) => {
    const root = document.createElement('div');
    const controller = new CalendarController();
    const onHierarchyNavigate = vi.fn();

    controller.render({
      root,
      viewMode,
      focusDate: new Date('2026-02-15T00:00:00'),
      sortMode: 'priority',
      appointments: [baseAppointment],
      onHierarchyNavigate,
    });

    const hierarchyCell = root.querySelector(selector);
    expect(hierarchyCell).toBeTruthy();

    hierarchyCell.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onHierarchyNavigate).toHaveBeenCalledTimes(1);
    const payload = onHierarchyNavigate.mock.calls[0][0];
    expect(payload.targetView).toBe(expectedTarget);
    expect(new Date(payload.focusDate).toString()).not.toBe('Invalid Date');
  });
});
