import { sortAppointments } from '../../core/schedulerEngine.js';
import { SORT_MODES } from '../../core/constants.js';
import { formatDateTime } from '../../core/dateUtils.js';
import { escapeHtml } from '../../core/sanitize.js';

export function renderAppointmentList(root, appointments) {
  const sorted = sortAppointments(appointments, SORT_MODES.PRIORITY).slice(0, 10);

  if (!sorted.length) {
    root.innerHTML = '<p class="small">No appointments yet.</p>';
    return;
  }

  root.innerHTML = `<div class="list">${sorted
    .map(
      (item) => `
        <article class="calendar-item">
          <h4>${escapeHtml(item.title)}</h4>
          <div class="small">${formatDateTime(new Date(item.date))}</div>
          <div class="small">${escapeHtml(item.category || 'general')} • Priority ${item.priority}</div>
        </article>
      `,
    )
    .join('')}</div>`;
}
