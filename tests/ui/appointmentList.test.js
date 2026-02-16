import { describe, expect, it } from 'vitest';
import { renderAppointmentList } from '../../src/modules/appointments/appointmentList.js';

describe('appointmentList', () => {
  it('renders empty message when no appointments exist', () => {
    const root = document.createElement('div');
    renderAppointmentList(root, []);
    expect(root.innerHTML).toContain('No appointments yet');
  });

  it('renders sorted items limited to 10', () => {
    const root = document.createElement('div');
    const appointments = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      date: `2026-02-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
      title: `Apt ${i}`,
      category: 'test',
      priority: (i % 10) + 1,
    }));

    renderAppointmentList(root, appointments);

    const articles = root.querySelectorAll('article');
    expect(articles.length).toBeLessThanOrEqual(10);
  });

  it('escapes HTML in titles', () => {
    const root = document.createElement('div');
    renderAppointmentList(root, [
      {
        id: '1',
        date: '2026-02-15T10:00:00.000Z',
        title: '<script>alert("xss")</script>',
        category: 'test',
        priority: 5,
      },
    ]);

    expect(root.innerHTML).not.toContain('<script>');
    expect(root.innerHTML).toContain('&lt;script&gt;');
  });
});
