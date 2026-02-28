import { formatDateTime } from '../../../core/dateUtils.js';
import { escapeHtml } from '../../../core/sanitize.js';
import { DEFAULT_CALENDAR_COLOR } from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';

export function renderDayView(items) {
  if (!items.length) return `<p class="small">${t('views.noAppointmentsDay')}</p>`;

  return `<div class="calendar-grid">${items
    .map(
      (item) => `
          <article class="calendar-item" style="border-left: 4px solid ${item.calendarColor || DEFAULT_CALENDAR_COLOR};">
          <button type="button" class="calendar-item-trigger" data-appointment-key="${encodeURIComponent(item.uiKey)}" aria-label="${t('views.openDetailsFor', { title: escapeHtml(item.title) })}">
            <h4>${escapeHtml(item.title)}</h4>
            <div class="small">${formatDateTime(new Date(item.occurrenceDate || item.date), { timeZone: item.timezone, includeTimeZone: true })}</div>
            <div class="small">${escapeHtml(item.description || t('details.noDescription'))}</div>
            <div><span class="badge">P${item.priority}</span> <span class="small">${escapeHtml(item.category || t('details.general'))} • ${escapeHtml(item.calendarId || 'default')}</span></div>
          </button>
        </article>
      `,
    )
    .join('')}</div>`;
}
