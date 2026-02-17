import { escapeHtml } from '../../../core/sanitize.js';
import { getDateKeyInTimeZone } from '../../../core/dateUtils.js';

function toMonthDayKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function renderMonthView(items, focusDate) {
  const year = focusDate.getFullYear();
  const month = focusDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const now = new Date();

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const headers = weekdayLabels.map((d) => `<div class="month-header"><strong>${d}</strong></div>`).join('');

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const leadingBlanks = Array.from({ length: firstWeekday }, () => '<div class="month-cell-blank"></div>').join('');

  const cells = Array.from({ length: totalDays }, (_, index) => index + 1)
    .map((dayNumber) => {
      const isToday =
        now.getFullYear() === year &&
        now.getMonth() === month &&
        now.getDate() === dayNumber;
      const dayItems = items.filter((item) => {
        const occurrence = new Date(item.occurrenceDate || item.date);
        return getDateKeyInTimeZone(occurrence, item.timezone) === toMonthDayKey(year, month, dayNumber);
      });
      const cellFocusDate = new Date(year, month, dayNumber, 9, 0, 0, 0).toISOString();

      return `
      <div class="month-cell hierarchy-cell ${isToday ? 'month-cell-today' : ''}" data-nav-target="week" data-focus-date="${cellFocusDate}" role="button" tabindex="0" aria-label="Open week view for day ${dayNumber}">
        <h4>${dayNumber}</h4>
        ${
          dayItems.length
            ? dayItems
                .slice(0, 3)
                .map(
                  (entry) =>
                    `<div class="small" style="border-left: 3px solid ${entry.calendarColor || '#2563eb'}; padding-left: 4px;"><button type="button" class="calendar-link" data-appointment-key="${encodeURIComponent(entry.uiKey)}">• ${escapeHtml(entry.title)} <span class="badge">P${entry.priority}</span></button></div>`,
                )
                .join('')
            : '<div class="small">No tasks</div>'
        }
      </div>`;
    })
    .join('');

  return `<div class="calendar-grid" style="grid-template-columns: repeat(7, minmax(0,1fr));">${headers}${leadingBlanks}${cells}</div>`;
}
