import { escapeHtml } from '../../../core/sanitize.js';
import { getDateKeyInTimeZone } from '../../../core/dateUtils.js';
import { DEFAULT_CALENDAR_COLOR } from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';

function toMonthDayKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildDayCells(items, focusDate) {
  const year = focusDate.getFullYear();
  const month = focusDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const now = new Date();

  return Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const isToday =
      now.getFullYear() === year &&
      now.getMonth() === month &&
      now.getDate() === dayNumber;
    const dayItems = items.filter((item) => {
      const occurrence = new Date(item.occurrenceDate || item.date);
      return getDateKeyInTimeZone(occurrence, item.timezone) === toMonthDayKey(year, month, dayNumber);
    });
    const cellFocusDate = new Date(year, month, dayNumber, 9, 0, 0, 0).toISOString();

    const cellHtml = `
      <div class="month-cell hierarchy-cell ${isToday ? 'month-cell-today' : ''}" data-nav-target="week" data-focus-date="${cellFocusDate}" role="button" tabindex="0" aria-label="${t('views.openWeekViewForDay', { day: dayNumber })}">
        <h4>${dayNumber}</h4>
        ${
          dayItems.length
            ? dayItems
                .slice(0, 3)
                .map(
                  (entry) =>
                    `<div class="small" style="border-left: 3px solid ${entry.calendarColor || DEFAULT_CALENDAR_COLOR}; padding-left: 4px;"><button type="button" class="calendar-link" data-appointment-key="${encodeURIComponent(entry.uiKey)}">• ${escapeHtml(entry.title)} <span class="badge">P${entry.priority}</span></button></div>`,
                )
                .join('')
            : `<div class="small">${t('views.noTasks')}</div>`
        }
      </div>`;

    return { dayNumber, cellHtml, weekday: (new Date(year, month, dayNumber).getDay() + 6) % 7 };
  });
}

export function renderMonthView(items, focusDate, rotated = false) {
  const year = focusDate.getFullYear();
  const month = focusDate.getMonth();
  const weekdayLabels = t('views.weekdays');

  const dayCells = buildDayCells(items, focusDate);

  if (rotated) {
    // Rotated: weekdays become rows (left), days go left-to-right within each row
    const byWeekday = Array.from({ length: 7 }, () => []);
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    // calculate how many week-columns we need
    const totalDays = new Date(year, month + 1, 0).getDate();
    const totalCols = Math.ceil((firstWeekday + totalDays) / 7);

    dayCells.forEach(({ cellHtml, weekday }) => {
      byWeekday[weekday].push(cellHtml);
    });

    // pad leading blanks per row
    const rows = byWeekday.map((cells, weekdayIdx) => {
      const blanksNeeded = weekdayIdx < firstWeekday ? 1 : 0;
      const blanks = Array.from({ length: blanksNeeded }, () => '<div class="month-cell-blank"></div>').join('');
      // pad trailing to fill
      const trailing = totalCols - blanksNeeded - cells.length;
      const trailingBlanks = Array.from({ length: Math.max(0, trailing) }, () => '<div class="month-cell-blank"></div>').join('');
      return `<div class="month-row"><div class="month-row-label">${weekdayLabels[weekdayIdx]}</div>${blanks}${cells.join('')}${trailingBlanks}</div>`;
    });

    return `<div class="calendar-grid-rotated">${rows.join('')}</div>`;
  }

  // Standard view: 7-column grid
  const headers = weekdayLabels.map((d) => `<div class="month-header"><strong>${d}</strong></div>`).join('');
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const leadingBlanks = Array.from({ length: firstWeekday }, () => '<div class="month-cell-blank"></div>').join('');
  const cells = dayCells.map(({ cellHtml }) => cellHtml).join('');

  return `<div class="calendar-grid" style="grid-template-columns: repeat(7, minmax(0,1fr));">${headers}${leadingBlanks}${cells}</div>`;
}
