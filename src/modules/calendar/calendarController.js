import { expandRecurringAppointments, getRangeByView, sortAppointments } from '../../core/schedulerEngine.js';
import { renderDayView } from './views/dayView.js';
import { renderWeekView } from './views/weekView.js';
import { renderMonthView } from './views/monthView.js';
import { renderYearView } from './views/yearView.js';
import { renderAgendaView } from './views/agendaView.js';

export class CalendarController {
  constructor() {
    this.visibleItemsByKey = new Map();
  }

  createAppointmentKey(item) {
    return `${item.sourceId || item.id}::${item.occurrenceDate || item.date}`;
  }

  render({ root, viewMode, focusDate, appointments, sortMode, onAppointmentClick, onHierarchyNavigate, calendarColorMap = new Map() }) {
    const [start, end] = getRangeByView(focusDate, viewMode);
    const expanded = expandRecurringAppointments(appointments, start, end);
    const sorted = sortAppointments(expanded, sortMode).map((item) => ({
      ...item,
      uiKey: this.createAppointmentKey(item),
      calendarColor: calendarColorMap.get(item.calendarId || 'default') || '#2563eb',
    }));

    this.visibleItemsByKey = new Map(sorted.map((item) => [item.uiKey, item]));

    if (typeof onAppointmentClick === 'function' || typeof onHierarchyNavigate === 'function') {
      root.onclick = (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const clickable = target.closest('[data-appointment-key]');
        if (clickable && typeof onAppointmentClick === 'function') {
          const appointmentKey = decodeURIComponent(clickable.getAttribute('data-appointment-key') || '');
          const selected = this.visibleItemsByKey.get(appointmentKey);
          if (selected) {
            onAppointmentClick(selected);
            return;
          }
        }

        const hierarchyCell = target.closest('[data-nav-target][data-focus-date]');
        if (hierarchyCell && typeof onHierarchyNavigate === 'function') {
          onHierarchyNavigate({
            targetView: hierarchyCell.getAttribute('data-nav-target'),
            focusDate: hierarchyCell.getAttribute('data-focus-date'),
          });
        }
      };
    } else {
      root.onclick = null;
    }

    if (viewMode === 'day') {
      root.innerHTML = renderDayView(sorted, focusDate);
      return;
    }

    if (viewMode === 'week') {
      root.innerHTML = renderWeekView(sorted, start);
      return;
    }

    if (viewMode === 'year') {
      root.innerHTML = renderYearView(sorted, focusDate);
      return;
    }

    if (viewMode === 'agenda') {
      root.innerHTML = renderAgendaView(sorted, focusDate);
      return;
    }

    root.innerHTML = renderMonthView(sorted, focusDate);
  }
}
