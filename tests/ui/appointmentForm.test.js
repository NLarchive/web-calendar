import { describe, expect, it, vi } from 'vitest';
import { renderAppointmentForm } from '../../src/modules/appointments/appointmentForm.js';

describe('appointment form', () => {
  it('submits structured payload', () => {
    const root = document.createElement('div');
    const onSubmit = vi.fn();

    renderAppointmentForm(root, onSubmit);

    root.querySelector('input[name="title"]').value = 'Test Appointment';
    root.querySelector('input[name="date"]').value = '2026-02-15T10:00';
    root.querySelector('input[name="priority"]').value = '7';

    root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].title).toBe('Test Appointment');
  });

  it('submits even when title is empty and includes recurrence count', () => {
    const root = document.createElement('div');
    const onSubmit = vi.fn();

    renderAppointmentForm(root, onSubmit);

    root.querySelector('input[name="date"]').value = '2026-02-15T10:00';
    root.querySelector('input[name="priority"]').value = '5';
    root.querySelector('select[name="recurrence"]').value = 'daily';
    root.querySelector('input[name="recurrenceCount"]').value = '4';

    root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].title).toBe('');
    expect(onSubmit.mock.calls[0][0].recurrenceCount).toBe('4');
  });
});
