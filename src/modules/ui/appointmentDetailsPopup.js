import { formatDateTime } from '../../core/dateUtils.js';
import { escapeHtml } from '../../core/sanitize.js';

function listOrFallback(items) {
  return items && items.length ? items.map((item) => escapeHtml(item)).join(', ') : 'None';
}

export function renderAppointmentDetails(root, appointment) {
  if (!appointment) {
    root.innerHTML = '<p class="small">No appointment selected.</p>';
    return;
  }

  const occurrence = new Date(appointment.occurrenceDate || appointment.date);

  root.innerHTML = `
    <div class="details-grid">
      <div><strong>Title:</strong> ${escapeHtml(appointment.title || 'Untitled')}</div>
      <div><strong>Date/Time:</strong> ${formatDateTime(occurrence)}</div>
      <div><strong>Recurrence:</strong> ${escapeHtml(appointment.recurrence || 'none')}</div>
      <div><strong>Priority:</strong> ${appointment.priority}</div>
      <div><strong>End Date/Time:</strong> ${appointment.endDate ? formatDateTime(new Date(appointment.endDate)) : 'Not set'}</div>
      <div><strong>Location:</strong> ${escapeHtml(appointment.location || 'Not set')}</div>
      <div><strong>Event URL:</strong> ${escapeHtml(appointment.url || 'Not set')}</div>
      <div><strong>Status:</strong> ${escapeHtml(appointment.status || 'confirmed')}</div>
      <div><strong>Attendees:</strong> ${listOrFallback(appointment.attendees)}</div>
      <div><strong>Category:</strong> ${escapeHtml(appointment.category || 'general')}</div>
      <div><strong>Tags:</strong> ${listOrFallback(appointment.tags)}</div>
      <div><strong>Contact:</strong> ${listOrFallback(appointment.contact)}</div>
      <div><strong>Description:</strong> ${escapeHtml(appointment.description || 'No description')}</div>
      <div><strong>Source ID:</strong> ${escapeHtml(appointment.sourceId || appointment.id)}</div>
    </div>
  `;
}
