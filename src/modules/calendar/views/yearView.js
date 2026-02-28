import { escapeHtml } from '../../../core/sanitize.js';
import { getDateKeyInTimeZone } from '../../../core/dateUtils.js';
import { DEFAULT_CALENDAR_COLOR } from '../../../core/constants.js';
import { getLocale, t } from '../../../i18n/index.js';

export function renderYearView(items, focusDate) {
  const year = focusDate.getFullYear();
  const now = new Date();
  const currentMonthIndex = now.getFullYear() === year ? now.getMonth() : -1;

  const months = Array.from({ length: 12 }, (_, index) => index)
    .map((monthIndex) => {
      const isCurrentMonth = monthIndex === currentMonthIndex;
      const monthItems = items.filter((item) => {
        const occurrence = new Date(item.occurrenceDate || item.date);
        const dateKey = getDateKeyInTimeZone(occurrence, item.timezone);
        return dateKey.startsWith(`${year}-${String(monthIndex + 1).padStart(2, '0')}-`);
      });
      const monthFocusDate = new Date(year, monthIndex, 1, 9, 0, 0, 0).toISOString();

      return `
      <article class="year-month hierarchy-cell ${isCurrentMonth ? 'month-cell-today' : ''}" data-nav-target="month" data-focus-date="${monthFocusDate}" role="button" tabindex="0" aria-label="${t('views.openMonthViewFor', { month: new Date(year, monthIndex, 1).toLocaleDateString(getLocale(), { month: 'long' }) })}">
        <h4>${new Date(year, monthIndex, 1).toLocaleDateString(getLocale(), { month: 'long' })}</h4>
        <div class="small">${t('views.appointments', { count: monthItems.length })}</div>
        ${monthItems
          .slice(0, 4)
          .map(
            (entry) =>
              `<div class="small" style="border-left: 3px solid ${entry.calendarColor || DEFAULT_CALENDAR_COLOR}; padding-left: 4px;"><button type="button" class="calendar-link" data-appointment-key="${encodeURIComponent(entry.uiKey)}">• ${escapeHtml(entry.title)} (P${entry.priority})</button></div>`,
          )
          .join('')}
      </article>`;
    })
    .join('');

  return `<div class="calendar-grid" style="grid-template-columns: repeat(3, minmax(0,1fr));">${months}</div>`;
}
