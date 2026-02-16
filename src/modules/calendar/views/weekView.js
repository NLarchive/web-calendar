import { escapeHtml } from '../../../core/sanitize.js';

export function renderWeekView(items, rangeStart) {
  const now = new Date();
  const todayKey = now.toDateString();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + index);
    return date;
  });

  const html = days
    .map((day) => {
      const dayKey = day.toDateString();
      const isToday = dayKey === todayKey;
      const dayItems = items.filter((item) => new Date(item.occurrenceDate || item.date).toDateString() === dayKey);
      const focusIso = day.toISOString();

      return `
      <div class="calendar-day hierarchy-cell ${isToday ? 'month-cell-today' : ''}" data-nav-target="day" data-focus-date="${focusIso}" role="button" tabindex="0" aria-label="Open day view for ${day.toLocaleDateString()}">
        <h4>${day.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })}</h4>
        ${
          dayItems.length
            ? `<ul>${dayItems
                .map(
                  (entry) =>
                    `<li style="border-left: 3px solid ${entry.calendarColor || '#2563eb'}; padding-left: 4px;"><button type="button" class="calendar-link" data-appointment-key="${encodeURIComponent(entry.uiKey)}">${escapeHtml(entry.title)} <span class="badge">P${entry.priority}</span></button></li>`,
                )
                .join('')}</ul>`
            : '<p class="small">No tasks</p>'
        }
      </div>`;
    })
    .join('');

  return `<div class="calendar-grid" style="grid-template-columns: repeat(2, minmax(0,1fr));">${html}</div>`;
}
