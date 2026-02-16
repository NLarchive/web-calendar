import { escapeHtml } from '../../../core/sanitize.js';

export function renderYearView(items, focusDate) {
  const year = focusDate.getFullYear();

  const months = Array.from({ length: 12 }, (_, index) => index)
    .map((monthIndex) => {
      const monthItems = items.filter((item) => {
        const occurrence = new Date(item.occurrenceDate || item.date);
        return occurrence.getFullYear() === year && occurrence.getMonth() === monthIndex;
      });
      const monthFocusDate = new Date(year, monthIndex, 1, 9, 0, 0, 0).toISOString();

      return `
      <article class="year-month hierarchy-cell" data-nav-target="month" data-focus-date="${monthFocusDate}" role="button" tabindex="0" aria-label="Open month view for ${new Date(year, monthIndex, 1).toLocaleDateString(undefined, { month: 'long' })}">
        <h4>${new Date(year, monthIndex, 1).toLocaleDateString(undefined, { month: 'long' })}</h4>
        <div class="small">Appointments: ${monthItems.length}</div>
        ${monthItems
          .slice(0, 4)
          .map(
            (entry) =>
              `<div class="small"><button type="button" class="calendar-link" data-appointment-key="${encodeURIComponent(entry.uiKey)}">• ${escapeHtml(entry.title)} (P${entry.priority})</button></div>`,
          )
          .join('')}
      </article>`;
    })
    .join('');

  return `<div class="calendar-grid" style="grid-template-columns: repeat(3, minmax(0,1fr));">${months}</div>`;
}
