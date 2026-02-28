import { VIEW_MODES, SORT_MODES } from '../../core/constants.js';
import { getSupportedTimeZones, normalizeTimeZone, getDetectedTimeZone } from '../../core/dateUtils.js';
import { getLanguage, getLocale, t } from '../../i18n/index.js';

export function renderNavbar(root, state, handlers) {
  const calendars = Array.isArray(state.calendars) ? state.calendars : [];
  const filters = state.filters || {};
  const activeLanguage = getLanguage();
  const sortModeLabel =
    state.sortMode === SORT_MODES.PRIORITY ? t('navbar.sortPriority') : t('navbar.sortDatetime');

  root.className = 'navbar';
  root.innerHTML = `
    <div class="navbar-main">
      <div class="navbar-section">
        <button data-action="prev" aria-label="${t('navbar.previousPeriod')}">◀</button>
        <button data-action="today">${t('navbar.today')}</button>
        <button data-action="next" aria-label="${t('navbar.nextPeriod')}">▶</button>
      </div>

      <div class="navbar-section">
        <label class="navbar-inline-label" for="view-mode-select">${t('navbar.view')}</label>
        <select id="view-mode-select" data-action="view-mode" aria-label="${t('navbar.selectCalendarView')}" name="viewMode">
          ${VIEW_MODES.map((mode) => `<option value="${mode}" ${state.viewMode === mode ? 'selected' : ''}>${t(`navbar.viewMode.${mode}`)}</option>`).join('')}
        </select>
      </div>

      <div class="navbar-clock" aria-live="polite" title="${t('navbar.currentTime')}"></div>
    </div>

    <div class="navbar-groups">
      <button class="primary" data-action="open-new-appointment">${t('navbar.newAppointment')}</button>

      <details class="navbar-group" data-group="actions">
        <summary>${t('navbar.actions')}</summary>
        <div class="navbar-group-panel">
          <button data-action="open-calculator">${t('navbar.calculator')}</button>
          <button data-action="open-sync-app">${t('navbar.syncApp')}</button>
          <button data-action="toggle-sort">${t('navbar.sort', { mode: sortModeLabel })}</button>
          <button data-action="save-state">${t('navbar.saveState')}</button>
          <button data-action="load-state">${t('navbar.loadState')}</button>
          <button data-action="toggle-info">${t('navbar.info')}</button>
          <div class="navbar-inline-label">${t('navbar.timezone')}
            <select id="navbar-timezone-select" name="timezone" aria-label="${t('navbar.timezone')}">
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
        <summary>${t('navbar.filters')}</summary>
        <div class="navbar-group-panel">
          <input id="navbar-search" name="search" data-action="search" placeholder="${t('navbar.searchPlaceholder')}" value="${filters.query || ''}" aria-label="${t('navbar.searchAppointments')}" />
          <select id="filter-status-select" name="filterStatus" data-action="filter-status" aria-label="${t('navbar.filterByStatus')}">
            <option value="all" ${(filters.status || 'all') === 'all' ? 'selected' : ''}>${t('navbar.allStatus')}</option>
            <option value="confirmed" ${filters.status === 'confirmed' ? 'selected' : ''}>${t('navbar.confirmed')}</option>
            <option value="tentative" ${filters.status === 'tentative' ? 'selected' : ''}>${t('navbar.tentative')}</option>
            <option value="cancelled" ${filters.status === 'cancelled' ? 'selected' : ''}>${t('navbar.cancelled')}</option>
          </select>
          <select id="filter-calendar-select" name="filterCalendar" data-action="filter-calendar" aria-label="${t('navbar.filterByCalendar')}">
            <option value="all" ${(filters.calendarId || 'all') === 'all' ? 'selected' : ''}>${t('navbar.allCalendars')}</option>
            ${calendars
              .map(
                (calendar) =>
                  `<option value="${calendar.id}" ${filters.calendarId === calendar.id ? 'selected' : ''}>${calendar.name}</option>`,
              )
              .join('')}
          </select>
          <label class="navbar-inline-label" for="filter-from-date">${t('navbar.from')}</label>
          <input id="filter-from-date" name="fromDate" data-action="filter-from-date" type="date" value="${filters.fromDate || ''}" aria-label="${t('navbar.filterFromDate')}" />
          <label class="navbar-inline-label" for="filter-to-date">${t('navbar.to')}</label>
          <input id="filter-to-date" name="toDate" data-action="filter-to-date" type="date" value="${filters.toDate || ''}" aria-label="${t('navbar.filterToDate')}" />
        </div>
      </details>

      <div class="navbar-language" aria-label="${t('navbar.language')}">
        <button data-action="set-lang-en" class="${activeLanguage === 'en' ? 'primary' : ''}" type="button">${t('navbar.languageEnglish')}</button>
        <button data-action="set-lang-es" class="${activeLanguage === 'es' ? 'primary' : ''}" type="button">${t('navbar.languageSpanish')}</button>
      </div>
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
  root.querySelector('[data-action="set-lang-en"]')?.addEventListener('click', () => handlers.onLanguageChange?.('en'));
  root.querySelector('[data-action="set-lang-es"]')?.addEventListener('click', () => handlers.onLanguageChange?.('es'));
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
      const formatter = new Intl.DateTimeFormat(getLocale(), {
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
