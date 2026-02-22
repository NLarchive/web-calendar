import { VIEW_MODES, SORT_MODES } from '../../core/constants.js';
import { getSupportedTimeZones, normalizeTimeZone, getDetectedTimeZone } from '../../core/dateUtils.js';

export function renderNavbar(root, state, handlers) {
  const calendars = Array.isArray(state.calendars) ? state.calendars : [];
  const filters = state.filters || {};

  root.className = 'navbar';
  root.innerHTML = `
    <div class="navbar-main">
      <div class="navbar-section">
        <button data-action="prev" aria-label="Previous period">◀</button>
        <button data-action="today">Today</button>
        <button data-action="next" aria-label="Next period">▶</button>
      </div>

      <div class="navbar-section">
        <label class="navbar-inline-label" for="view-mode-select">View</label>
        <select id="view-mode-select" data-action="view-mode" aria-label="Select calendar view" name="viewMode">
          ${VIEW_MODES.map((mode) => `<option value="${mode}" ${state.viewMode === mode ? 'selected' : ''}>${mode[0].toUpperCase() + mode.slice(1)}</option>`).join('')}
        </select>
      </div>

      <div class="navbar-clock" aria-live="polite" title="Current Time"></div>
    </div>

    <div class="navbar-groups">
      <button class="primary" data-action="open-new-appointment">+ New Appointment</button>

      <details class="navbar-group" data-group="actions">
        <summary>Actions</summary>
        <div class="navbar-group-panel">
          <button data-action="open-calculator">Calendar Calculator</button>
          <button data-action="open-sync-app">Sync App</button>
          <button data-action="toggle-sort">Sort: ${state.sortMode === SORT_MODES.PRIORITY ? 'Priority' : 'Date/Time'}</button>
          <button data-action="save-state">Save State</button>
          <button data-action="load-state">Load State</button>
          <button data-action="toggle-info">Info</button>
          <div class="navbar-inline-label">Timezone
            <select id="navbar-timezone-select" name="timezone" aria-label="Select timezone">
              ${(() => {
                const defaultTZ = normalizeTimeZone(getDetectedTimeZone());
                const opts = getSupportedTimeZones(defaultTZ);
                return opts.map((t) => `<option value="${t}" ${t === defaultTZ ? 'selected' : ''}>${t}</option>`).join('');
              })()}
            </select>
          </div>
        </div>
      </details>

      <details class="navbar-group" data-group="filters">
        <summary>Filters</summary>
        <div class="navbar-group-panel">
          <input id="navbar-search" name="search" data-action="search" placeholder="Search title/description/category/tags" value="${filters.query || ''}" aria-label="Search appointments" />
          <select id="filter-status-select" name="filterStatus" data-action="filter-status" aria-label="Filter by status">
            <option value="all" ${(filters.status || 'all') === 'all' ? 'selected' : ''}>All Status</option>
            <option value="confirmed" ${filters.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="tentative" ${filters.status === 'tentative' ? 'selected' : ''}>Tentative</option>
            <option value="cancelled" ${filters.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <select id="filter-calendar-select" name="filterCalendar" data-action="filter-calendar" aria-label="Filter by calendar">
            <option value="all" ${(filters.calendarId || 'all') === 'all' ? 'selected' : ''}>All Calendars</option>
            ${calendars
              .map(
                (calendar) =>
                  `<option value="${calendar.id}" ${filters.calendarId === calendar.id ? 'selected' : ''}>${calendar.name}</option>`,
              )
              .join('')}
          </select>
          <label class="navbar-inline-label" for="filter-from-date">From</label>
          <input id="filter-from-date" name="fromDate" data-action="filter-from-date" type="date" value="${filters.fromDate || ''}" aria-label="Filter from date" />
          <label class="navbar-inline-label" for="filter-to-date">To</label>
          <input id="filter-to-date" name="toDate" data-action="filter-to-date" type="date" value="${filters.toDate || ''}" aria-label="Filter to date" />
        </div>
      </details>
    </div>
  `;

  root.querySelector('[data-action="prev"]').addEventListener('click', handlers.onPrev);
  root.querySelector('[data-action="open-new-appointment"]').addEventListener('click', handlers.onOpenNewAppointment);
  root.querySelector('[data-action="open-calculator"]').addEventListener('click', handlers.onOpenCalculator);
  root.querySelector('[data-action="today"]').addEventListener('click', handlers.onToday);
  root.querySelector('[data-action="next"]').addEventListener('click', handlers.onNext);
  root.querySelector('[data-action="open-sync-app"]').addEventListener('click', handlers.onOpenSyncApp);
  root.querySelector('[data-action="toggle-sort"]').addEventListener('click', handlers.onToggleSort);
  root.querySelector('[data-action="save-state"]').addEventListener('click', handlers.onSaveState);
  root.querySelector('[data-action="load-state"]').addEventListener('click', handlers.onOpenLoadState);
  root.querySelector('[data-action="toggle-info"]').addEventListener('click', handlers.onToggleInfo);
  root.querySelector('[data-action="view-mode"]').addEventListener('change', (event) =>
    handlers.onViewChange(event.target.value),
  );
  root.querySelector('[data-action="search"]').addEventListener('input', (event) =>
    handlers.onSearchChange(event.target.value),
  );
  root.querySelector('[data-action="filter-status"]').addEventListener('change', (event) =>
    handlers.onFilterStatusChange(event.target.value),
  );
  root.querySelector('[data-action="filter-calendar"]').addEventListener('change', (event) =>
    handlers.onFilterCalendarChange(event.target.value),
  );
  root.querySelector('[data-action="filter-from-date"]').addEventListener('change', (event) =>
    handlers.onFilterFromDateChange(event.target.value),
  );
  root.querySelector('[data-action="filter-to-date"]').addEventListener('change', (event) =>
    handlers.onFilterToDateChange(event.target.value),
  );

  if (typeof root.__navbarCleanup === 'function') {
    root.__navbarCleanup();
  }

  const groups = [...root.querySelectorAll('.navbar-group')];
  const closeAllGroups = () => {
    groups.forEach((group) => {
      group.open = false;
    });
  };

  groups.forEach((group) => {
    group.addEventListener('toggle', () => {
      if (!group.open) return;
      groups.forEach((other) => {
        if (other !== group) other.open = false;
      });
    });
  });

  const onDocumentClick = (event) => {
    if (root.contains(event.target)) return;
    closeAllGroups();
  };

  const onDocumentKeydown = (event) => {
    if (event.key !== 'Escape') return;
    closeAllGroups();
  };

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);

  // navbar timezone + clock control (select inside actions dropdown)
  const tzStorageKey = 'web-appointment-timezone';
  const clockEl = root.querySelector('.navbar-clock');
  const tzSelect = root.querySelector('#navbar-timezone-select');

  function getSelectedTimeZone() {
    return (
      (tzSelect && tzSelect.value) ||
      window.localStorage.getItem(tzStorageKey) ||
      normalizeTimeZone(getDetectedTimeZone())
    );
  }

  function setSelectedTimeZone(value) {
    if (!value) return;
    const safe = normalizeTimeZone(value);
    if (tzSelect) tzSelect.value = safe;
    try {
      window.localStorage.setItem(tzStorageKey, safe);
    } catch {}
  }

  function updateClock() {
    try {
      const now = new Date();
      const tz = getSelectedTimeZone();
      const formatter = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: tz,
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const hour = parts.find((p) => p.type === 'hour')?.value || '00';
      const minute = parts.find((p) => p.type === 'minute')?.value || '00';
      const day = parts.find((p) => p.type === 'day')?.value || '01';
      const month = parts.find((p) => p.type === 'month')?.value || '01';
      const year = parts.find((p) => p.type === 'year')?.value || '2026';
      // Hide timezone on phones
      const isPhone = window.matchMedia('(max-width: 768px)').matches;
      if (clockEl) {
        clockEl.textContent = isPhone
          ? `${hour}:${minute}, ${day}/${month}/${year}`
          : `${hour}:${minute}, ${day}/${month}/${year}, ${tz}`;
      }
    } catch (err) {
      // no-op
    }
  }

  setSelectedTimeZone(window.localStorage.getItem(tzStorageKey) || normalizeTimeZone(getDetectedTimeZone()));
  updateClock();

  // align interval to minute boundary for smooth UX
  const nowForClock = new Date();
  const msToNextMinute = (60 - nowForClock.getSeconds()) * 1000 - nowForClock.getMilliseconds();
  root.__navbarClockTimeout = setTimeout(() => {
    updateClock();
    root.__navbarClockInterval = setInterval(updateClock, 60 * 1000);
  }, msToNextMinute);

  tzSelect?.addEventListener('change', (e) => {
    setSelectedTimeZone(e.target.value);
    updateClock();
    // No group to close, just update
  });

  root.__navbarCleanup = () => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
    if (root.__navbarClockInterval) {
      clearInterval(root.__navbarClockInterval);
      root.__navbarClockInterval = null;
    }
    if (root.__navbarClockTimeout) {
      clearTimeout(root.__navbarClockTimeout);
      root.__navbarClockTimeout = null;
    }
  };
}
