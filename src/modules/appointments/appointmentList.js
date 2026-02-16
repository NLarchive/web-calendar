import { sortAppointments } from '../../core/schedulerEngine.js';
import { SORT_MODES } from '../../core/constants.js';
import { formatDateTime } from '../../core/dateUtils.js';
import { escapeHtml } from '../../core/sanitize.js';

export function renderAppointmentList(root, appointments, calendarColorMap = new Map(), onAppointmentClick) {
  const sorted = sortAppointments(appointments, SORT_MODES.PRIORITY).slice(0, 10);

  if (!sorted.length) {
    root.innerHTML = '<p class="small">No appointments yet.</p>';
    return;
  }

  root.innerHTML = `<div class="list">${sorted
    .map(
      (item, index) => `
        <article class="calendar-item" style="border-left: 4px solid ${calendarColorMap.get(item.calendarId || 'default') || '#2563eb'};">
          <button
            class="calendar-item-trigger"
            data-action="open-appointment-details"
            data-appointment-key="${item.id || index}"
            aria-label="Open appointment details"
          >
            <h4>${escapeHtml(item.title)}</h4>
            <div class="small">${formatDateTime(new Date(item.date))}</div>
            <div class="small">${escapeHtml(item.category || 'general')} • Priority ${item.priority} • ${escapeHtml(item.calendarId || 'default')}</div>
          </button>
        </article>
      `,
    )
    .join('')}</div>`;

  if (typeof onAppointmentClick === 'function') {
    const byKey = new Map();
    sorted.forEach((item, index) => {
      byKey.set(String(item.id || index), item);
    });

    root.querySelectorAll('[data-action="open-appointment-details"]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const key = trigger.getAttribute('data-appointment-key');
        if (!key) return;
        const appointment = byKey.get(String(key));
        if (!appointment) return;
        onAppointmentClick(appointment);
      });
    });
  }
}
