import { describe, expect, it } from 'vitest';
import { renderAppointmentDetails } from '../../src/modules/ui/appointmentDetailsPopup.js';

const sampleAppointment = {
  id: 'test-1',
  date: '2026-02-15T10:00:00.000Z',
  occurrenceDate: '2026-02-15T10:00:00.000Z',
  endDate: '2026-02-15T11:00:00.000Z',
  recurrence: 'yearly',
  title: 'Dog vaccine booster',
  description: 'Annual visit',
  location: 'Central Vet Clinic',
  url: 'https://myvet.com',
  status: 'confirmed',
  attendees: ['owner@example.com', 'vet@example.com'],
  contact: ['https://myvet.com'],
  category: 'dog',
  tags: ['vaccine', 'dog'],
  priority: 9,
};

describe('appointmentDetailsPopup', () => {
  it('renders all appointment fields', () => {
    const root = document.createElement('div');
    renderAppointmentDetails(root, sampleAppointment);

    expect(root.innerHTML).toContain('Dog vaccine booster');
    expect(root.innerHTML).toContain('yearly');
    expect(root.innerHTML).toContain('9'); // priority
    expect(root.innerHTML).toContain('Central Vet Clinic');
    expect(root.innerHTML).toContain('https://myvet.com');
    expect(root.innerHTML).toContain('confirmed');
    expect(root.innerHTML).toContain('owner@example.com');
    expect(root.innerHTML).toContain('vaccine');
    expect(root.innerHTML).toContain('Annual visit');
  });

  it('renders fallback when no appointment is provided', () => {
    const root = document.createElement('div');
    renderAppointmentDetails(root, null);

    expect(root.innerHTML).toContain('No appointment selected');
  });

  it('escapes HTML in user-provided fields', () => {
    const root = document.createElement('div');
    renderAppointmentDetails(root, {
      ...sampleAppointment,
      title: '<img src=x onerror=alert(1)>',
      description: '<script>bad</script>',
    });

    expect(root.innerHTML).not.toContain('<img');
    expect(root.innerHTML).not.toContain('<script>');
    expect(root.innerHTML).toContain('&lt;img');
  });

  it('handles missing optional fields gracefully', () => {
    const root = document.createElement('div');
    renderAppointmentDetails(root, {
      id: 'minimal',
      date: '2026-02-15T10:00:00.000Z',
      priority: 1,
    });

    expect(root.innerHTML).toContain('Untitled');
    expect(root.innerHTML).toContain('Not set');
    expect(root.innerHTML).toContain('None');
  });
});
