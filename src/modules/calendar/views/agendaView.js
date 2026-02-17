import { escapeHtml } from '../../../core/sanitize.js';
import { formatDateTime, getDateKeyInTimeZone } from '../../../core/dateUtils.js';

export function renderAgendaView(items, focusDate) {
  if (!items.length) {
    return `
      <div class="agenda-view empty">
        <p class="small">No appointments in this period.</p>
      </div>
    `;
  }

  // Group items by day
  const groups = new Map();
  items.forEach((item) => {
    const d = new Date(item.occurrenceDate || item.date);
    const key = getDateKeyInTimeZone(d, item.timezone);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  const todayKey = getDateKeyInTimeZone(new Date());

  const content = sortedKeys.map(key => {
    const dayItems = groups.get(key);
    const isToday = key === todayKey;

    return `
      <div class="agenda-day">
        <h3 class="agenda-date-header" style="${isToday ? 'color: var(--accent); border-bottom-color: var(--accent);' : ''}">${key} ${isToday ? '(Today)' : ''}</h3>
        <div class="list">
          ${dayItems.map(item => `
            <article class="calendar-item" style="border-left: 4px solid ${item.calendarColor || '#2563eb'};">
              <button 
                type="button" 
                class="calendar-item-trigger" 
                data-appointment-key="${encodeURIComponent(item.uiKey)}"
                aria-label="Open details for ${escapeHtml(item.title)}"
              >
                <h4>${escapeHtml(item.title)}</h4>
                <div class="small">${formatDateTime(new Date(item.occurrenceDate || item.date), { timeZone: item.timezone, includeTimeZone: true })}</div>
                <div class="small">${escapeHtml(item.category || 'general')} • P${item.priority}</div>
              </button>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="agenda-view">${content}</div>`;
}
