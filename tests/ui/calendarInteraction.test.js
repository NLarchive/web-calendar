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
  createdAt: '2026-02-15T00:00:00.000Z',
};

describe('calendar item interactions', () => {
  it.each(['day', 'week', 'month', 'year'])('opens details when clicking item in %s view', (viewMode) => {
    const root = document.createElement('div');
    const controller = new CalendarController();
    const onAppointmentClick = vi.fn();

    controller.render({
      root,
      viewMode,
      focusDate: new Date('2026-02-15T00:00:00'),
      sortMode: 'priority',
      appointments: [baseAppointment],
      onAppointmentClick,
    });

    const clickable = root.querySelector('[data-appointment-key]');
    expect(clickable).toBeTruthy();

    clickable.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onAppointmentClick).toHaveBeenCalledTimes(1);
    expect(onAppointmentClick.mock.calls[0][0].title).toBe('Vet Check');
  });
});
