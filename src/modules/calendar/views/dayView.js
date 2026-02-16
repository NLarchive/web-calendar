import { formatDateTime } from '../../../core/dateUtils.js';
import { escapeHtml } from '../../../core/sanitize.js';

export function renderDayView(items) {
  if (!items.length) return '<p class="small">No appointments for this day.</p>';

  return `<div class="calendar-grid">${items
    .map(
      (item) => `
        <article class="calendar-item">
          <button type="button" class="calendar-item-trigger" data-appointment-key="${encodeURIComponent(item.uiKey)}" aria-label="Open details for ${escapeHtml(item.title)}">
            <h4>${escapeHtml(item.title)}</h4>
            <div class="small">${formatDateTime(new Date(item.occurrenceDate || item.date))}</div>
            <div class="small">${escapeHtml(item.description || 'No description')}</div>
            <div><span class="badge">P${item.priority}</span> <span class="small">${escapeHtml(item.category || 'general')}</span></div>
          </button>
        </article>
      `,
    )
    .join('')}</div>`;
}
