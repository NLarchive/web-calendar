import { describe, expect, it } from 'vitest';
import { CalendarController } from '../../src/modules/calendar/calendarController.js';

describe('calendar controller', () => {
  it('renders month view content', () => {
    const root = document.createElement('div');
    const controller = new CalendarController();

    controller.render({
      root,
      viewMode: 'month',
      focusDate: new Date('2026-02-15T00:00:00Z'),
      sortMode: 'priority',
      appointments: [
        {
          id: '1',
          date: '2026-02-15T10:00:00.000Z',
          recurrence: 'none',
          title: 'Vet',
          description: '',
          contact: [],
          category: 'health',
          tags: [],
          priority: 9,
          createdAt: '2026-02-15T00:00:00.000Z',
        },
      ],
    });

    expect(root.innerHTML).toContain('Vet');
    expect(root.innerHTML).toContain('P9');
    expect(root.innerHTML).toContain('data-appointment-key');
  });
});
