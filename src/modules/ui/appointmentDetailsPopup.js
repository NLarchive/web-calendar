import { formatDateTime } from '../../core/dateUtils.js';

function listOrFallback(items) {
  return items && items.length ? items.join(', ') : 'None';
}

export function renderAppointmentDetails(root, appointment) {
  if (!appointment) {
    root.innerHTML = '<p class="small">No appointment selected.</p>';
    return;
  }

  const occurrence = new Date(appointment.occurrenceDate || appointment.date);

  root.innerHTML = `
    <div class="details-grid">
      <div><strong>Title:</strong> ${appointment.title || 'Untitled'}</div>
      <div><strong>Date/Time:</strong> ${formatDateTime(occurrence)}</div>
      <div><strong>Recurrence:</strong> ${appointment.recurrence || 'none'}</div>
      <div><strong>Priority:</strong> ${appointment.priority}</div>
      <div><strong>Category:</strong> ${appointment.category || 'general'}</div>
      <div><strong>Tags:</strong> ${listOrFallback(appointment.tags)}</div>
      <div><strong>Contact:</strong> ${listOrFallback(appointment.contact)}</div>
      <div><strong>Description:</strong> ${appointment.description || 'No description'}</div>
      <div><strong>Source ID:</strong> ${appointment.sourceId || appointment.id}</div>
    </div>
  `;
}
