import { formatDateTime } from '../../../core/dateUtils.js';

export function renderDayView(items) {
  if (!items.length) return '<p class="small">No appointments for this day.</p>';

  return `<div class="calendar-grid">${items
    .map(
      (item) => `
        <article class="calendar-item">
          <button type="button" class="calendar-item-trigger" data-appointment-key="${item.uiKey}" aria-label="Open details for ${item.title}">
            <h4>${item.title}</h4>
            <div class="small">${formatDateTime(new Date(item.occurrenceDate || item.date))}</div>
            <div class="small">${item.description || 'No description'}</div>
            <div><span class="badge">P${item.priority}</span> <span class="small">${item.category}</span></div>
          </button>
        </article>
      `,
    )
    .join('')}</div>`;
}
