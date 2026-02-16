import { CacheMemory } from '../core/cacheMemory.js';
import { EventBus } from '../core/eventBus.js';
import { normalizeAppointment } from '../core/schedulerEngine.js';
import { loadFromLocalStorage, saveToLocalStorage } from '../core/storage.js';
import { DEFAULT_CALENDARS, SORT_MODES, VIEW_MODES } from '../core/constants.js';
import { renderNavbar } from '../modules/ui/navbar.js';
import { closeInfoPanel, renderInfoPanel, toggleInfoPanel } from '../modules/ui/infoPanel.js';
import { renderAppointmentDetails } from '../modules/ui/appointmentDetailsPopup.js';
import { renderAppointmentForm } from '../modules/appointments/appointmentForm.js';
import { renderAppointmentList } from '../modules/appointments/appointmentList.js';
import { CalendarController } from '../modules/calendar/calendarController.js';
import { createDefaultConnectorRegistry } from '../connectors/connectorRegistry.js';
import { PluginManager } from '../plugins/pluginManager.js';
import { CalendarCalculatorPlugin } from '../plugins/calendarCalculatorPlugin.js';
import { getPreferredFormatForTargetApp, parseCalendarStateFile } from '../modules/sync/calendarSyncFormats.js';



function formatFocusLabel(viewMode, focusDate) {
  // concise label for the calendar header (used in #current-datetime)
  if (!focusDate || !(focusDate instanceof Date)) return '';

  if (viewMode === 'day') {
    return focusDate.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (viewMode === 'week') {
    const start = new Date(focusDate);
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `Week: ${start.toLocaleDateString()} — ${end.toLocaleDateString()}`;
  }

  if (viewMode === 'year') {
    return `Year: ${focusDate.getFullYear()}`;
  }

  // month
  return focusDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export class App {
  constructor(roots) {
    this.roots = roots;
    this.cache = new CacheMemory();
    this.eventBus = new EventBus();
    this.calendarController = new CalendarController();
    this.pluginManager = new PluginManager();
    this.pluginManager.register(new CalendarCalculatorPlugin());
    this.connectorRegistry = createDefaultConnectorRegistry();

    const persisted = loadFromLocalStorage();
    const persistedFocusDate = persisted?.focusDate ? new Date(persisted.focusDate) : null;
    const hasValidPersistedFocusDate =
      persistedFocusDate instanceof Date && !Number.isNaN(persistedFocusDate.getTime());

    this.state = {
      appointments: persisted?.appointments || [],
      viewMode: persisted?.viewMode || 'month',
      sortMode: persisted?.sortMode || SORT_MODES.PRIORITY,
      focusDate: hasValidPersistedFocusDate ? persistedFocusDate : new Date(),
      calendars: Array.isArray(persisted?.calendars) && persisted.calendars.length
        ? persisted.calendars
        : DEFAULT_CALENDARS,
      filters: {
        query: persisted?.filters?.query || '',
        status: persisted?.filters?.status || 'all',
        calendarId: persisted?.filters?.calendarId || 'all',
        fromDate: persisted?.filters?.fromDate || '',
        toDate: persisted?.filters?.toDate || '',
      },
    };

    this.syncMode = 'sync';
    this.editingAppointmentId = null;
    this.selectedAppointmentId = null;
    this.reminderTimerId = null;
    this.triggeredReminderKeys = new Set();
  }

  start() {
    this.bindEventListeners();
    this.bindModalFocusTraps();
    this.render();
    renderInfoPanel(this.roots.infoRoot, {
      onClose: () => closeInfoPanel(this.roots.infoRoot),
    });
    this.pluginManager.emit('onAppReady', { app: this });

    this.startReminderLoop();

    // NOTE: `#current-datetime` shows the calendar focus (view + date) — updated in render().
  }

  bindEventListeners() {
    this.mountAppointmentForm();

    this.roots.closeModalButton?.addEventListener('click', () => this.closeAppointmentModal());
    this.roots.modalRoot?.addEventListener('click', (event) => {
      if (event.target === this.roots.modalRoot) {
        this.closeAppointmentModal();
      }
    });

    this.roots.closeDetailsModalButton?.addEventListener('click', () => this.closeAppointmentDetailsModal());
    this.roots.detailsModalRoot?.addEventListener('click', (event) => {
      if (event.target === this.roots.detailsModalRoot) {
        this.closeAppointmentDetailsModal();
      }
    });

    this.roots.closeSyncModalButton?.addEventListener('click', () => this.closeSyncModal());
    this.roots.syncModalRoot?.addEventListener('click', (event) => {
      if (event.target === this.roots.syncModalRoot) {
        this.closeSyncModal();
      }
    });

    this.roots.closeStateLoadModalButton?.addEventListener('click', () => this.closeStateLoadModal());
    this.roots.stateLoadModalRoot?.addEventListener('click', (event) => {
      if (event.target === this.roots.stateLoadModalRoot) {
        this.closeStateLoadModal();
      }
    });

    this.roots.syncFormRoot?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.runSyncFlow();
      this.closeSyncModal();
    });

    this.roots.stateLoadSourceRoot?.addEventListener('change', () => {
      this.updateStateLoadSourceUI();
    });

    this.roots.stateLoadFormRoot?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.runStateLoadFlow();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (this.roots.detailsModalRoot && !this.roots.detailsModalRoot.classList.contains('hidden')) this.closeAppointmentDetailsModal();
      else if (this.roots.modalRoot && !this.roots.modalRoot.classList.contains('hidden')) this.closeAppointmentModal();
      else if (this.roots.syncModalRoot && !this.roots.syncModalRoot.classList.contains('hidden')) this.closeSyncModal();
      else if (this.roots.stateLoadModalRoot && !this.roots.stateLoadModalRoot.classList.contains('hidden')) this.closeStateLoadModal();
      else if (this.roots.infoRoot && !this.roots.infoRoot.classList.contains('hidden')) closeInfoPanel(this.roots.infoRoot);
    });

    this.eventBus.on('state:updated', () => {
      this.persist();
      this.render();
    });

    this.updateStateLoadSourceUI();
  }

  bindModalFocusTraps() {
    const traps = [
      this.roots.modalRoot,
      this.roots.detailsModalRoot,
      this.roots.syncModalRoot,
      this.roots.stateLoadModalRoot,
      this.roots.infoRoot,
    ].filter(Boolean);

    traps.forEach((root) => {
      root.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab' || root.classList.contains('hidden')) return;

        const focusable = [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
          .filter((entry) => !entry.disabled);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    });
  }

  mountAppointmentForm(appointment = null) {
    renderAppointmentForm(
      this.roots.formRoot,
      async (rawData) => {
        try {
          const normalizedInput = {
            ...rawData,
            id: this.editingAppointmentId || undefined,
            createdAt:
              this.state.appointments.find((item) => item.id === this.editingAppointmentId)?.createdAt || undefined,
          };
          const appointmentValue = normalizeAppointment(normalizedInput);

          if (this.editingAppointmentId) {
            const index = this.state.appointments.findIndex((item) => item.id === this.editingAppointmentId);
            if (index >= 0) {
              this.state.appointments.splice(index, 1, appointmentValue);
            }
          } else {
            await this.pluginManager.emit('beforeAppointmentCreate', appointmentValue);
            this.state.appointments.push(appointmentValue);
            await this.pluginManager.emit('afterAppointmentCreate', appointmentValue);
          }

          this.editingAppointmentId = null;
          this.persist();
          this.render();
          this.closeAppointmentModal();
        } catch (error) {
          alert(error?.message || 'Unable to save appointment.');
        }
      },
      {
        mode: appointment ? 'edit' : 'create',
        appointment,
        calendarOptions: this.state.calendars,
      },
    );
  }

  shiftFocusDate(delta) {
    const next = new Date(this.state.focusDate);

    if (this.state.viewMode === 'day') next.setDate(next.getDate() + delta);
    else if (this.state.viewMode === 'week') next.setDate(next.getDate() + delta * 7);
    else if (this.state.viewMode === 'year') next.setFullYear(next.getFullYear() + delta);
    else next.setMonth(next.getMonth() + delta);

    this.state.focusDate = next;
    this.eventBus.emit('state:updated');
  }

  applyLoadedState(nextState) {
    const parsedFocusDate = nextState.focusDate ? new Date(nextState.focusDate) : this.state.focusDate;
    const focusDate = Number.isNaN(parsedFocusDate.getTime()) ? this.state.focusDate : parsedFocusDate;

    this.state = {
      ...this.state,
      ...nextState,
      appointments: Array.isArray(nextState.appointments) ? nextState.appointments : this.state.appointments,
      calendars: Array.isArray(nextState.calendars) && nextState.calendars.length ? nextState.calendars : this.state.calendars,
      filters: {
        ...this.state.filters,
        ...(nextState.filters || {}),
      },
      focusDate,
    };
    this.eventBus.emit('state:updated');
  }

  persist() {
    const stateToStore = {
      ...this.state,
      focusDate: this.state.focusDate.toISOString(),
    };

    this.cache.set('state', stateToStore);
    const ok = saveToLocalStorage(stateToStore);
    if (!ok) {
      alert('Unable to save state to local storage. You can still export state manually.');
    }
  }

  openAppointmentModal() {
    this.mountAppointmentForm(
      this.editingAppointmentId
        ? this.state.appointments.find((item) => item.id === this.editingAppointmentId) || null
        : null,
    );
    this.roots.modalRoot?.classList.remove('hidden');
    const title = document.getElementById('appointment-modal-title');
    if (title) {
      title.textContent = this.editingAppointmentId ? 'Edit Appointment' : 'New Appointment';
    }
    this.roots.formRoot?.querySelector('input,select,textarea,button')?.focus();
  }

  closeAppointmentModal() {
    this.editingAppointmentId = null;
    this.roots.modalRoot?.classList.add('hidden');
  }

  openAppointmentDetailsModal(appointment) {
    this.selectedAppointmentId = appointment?.sourceId || appointment?.id || null;
    renderAppointmentDetails(this.roots.detailsContentRoot, appointment);
    this.roots.detailsContentRoot?.querySelector('[data-action="edit-appointment"]')?.addEventListener('click', () => {
      this.closeAppointmentDetailsModal();
      if (!this.selectedAppointmentId) return;
      this.editingAppointmentId = this.selectedAppointmentId;
      this.openAppointmentModal();
    });
    this.roots.detailsContentRoot?.querySelector('[data-action="delete-appointment"]')?.addEventListener('click', () => {
      if (!this.selectedAppointmentId) return;
      const confirmed = typeof window.confirm !== 'function' || window.confirm('Delete this appointment?');
      if (!confirmed) return;
      this.state.appointments = this.state.appointments.filter((item) => item.id !== this.selectedAppointmentId);
      this.persist();
      this.render();
      this.closeAppointmentDetailsModal();
    });
    this.roots.detailsModalRoot?.classList.remove('hidden');
    this.roots.detailsContentRoot?.querySelector('button')?.focus();
  }

  closeAppointmentDetailsModal() {
    this.roots.detailsModalRoot?.classList.add('hidden');
    this.selectedAppointmentId = null;
  }

  openSyncModal(mode = 'sync') {
    this.syncMode = mode;
    if (this.roots.syncActionLabelRoot) {
      this.roots.syncActionLabelRoot.value = mode === 'save' ? 'Save State' : 'Sync App';
    }

    if (this.roots.syncFormatRoot) {
      if (mode === 'sync') {
        this.roots.syncFormatRoot.value = 'auto';
        this.roots.syncFormatRoot.disabled = true;
      } else {
        this.roots.syncFormatRoot.disabled = false;
      }
    }

    this.roots.syncModalRoot?.classList.remove('hidden');
  }

  closeSyncModal() {
    this.roots.syncModalRoot?.classList.add('hidden');
  }

  openStateLoadModal() {
    this.roots.stateLoadModalRoot?.classList.remove('hidden');
    this.updateStateLoadSourceUI();
  }

  closeStateLoadModal() {
    this.roots.stateLoadModalRoot?.classList.add('hidden');
  }

  updateStateLoadSourceUI() {
    const source = this.roots.stateLoadSourceRoot?.value || 'sample';
    if (this.roots.sampleStateFieldsRoot) {
      this.roots.sampleStateFieldsRoot.classList.toggle('hidden', source !== 'sample');
    }
    if (this.roots.customStateFieldsRoot) {
      this.roots.customStateFieldsRoot.classList.toggle('hidden', source !== 'custom');
    }
  }

  confirmStateReplacement() {
    const message = 'Loading a new state will replace current appointments. Save State first if you want a backup. Continue?';
    if (typeof window.confirm !== 'function') return true;
    return window.confirm(message);
  }

  async runStateLoadFlow() {
    if (!this.confirmStateReplacement()) return;

    const source = this.roots.stateLoadSourceRoot?.value || 'sample';

    try {
      if (source === 'empty') {
        this.applyLoadedState({
          appointments: [],
          viewMode: 'month',
          sortMode: SORT_MODES.PRIORITY,
          focusDate: new Date().toISOString(),
        });
        this.closeStateLoadModal();
        return;
      }

      if (source === 'custom') {
        const file = this.roots.stateLoadFileRoot?.files?.[0];
        if (!file) {
          alert('Please select a state file.');
          return;
        }

        const nextState = await parseCalendarStateFile(file);
        this.applyLoadedState(nextState);
        this.closeStateLoadModal();
        return;
      }

      const sampleName = this.roots.stateLoadSampleRoot?.value;
      if (!sampleName) {
        alert('Please select a sample state.');
        return;
      }

      const isGitHubPages = window.location.hostname === 'nlarchive.github.io';
      const baseUrl = isGitHubPages
        ? 'https://raw.githubusercontent.com/NLarchive/web-calendar/main/data/'
        : './data/';

      const response = await fetch(`${baseUrl}${sampleName}`);
      if (!response.ok) throw new Error('Failed to load sample state');

      const nextState = await response.json();
      this.applyLoadedState(nextState);
      this.closeStateLoadModal();
    } catch (error) {
      if (source === 'custom') {
        alert('Invalid state file');
        return;
      }

      alert(`Failed to load state: ${error?.message || 'Unknown error'}`);
    }
  }

  async runSyncFlow() {
    const format = this.syncMode === 'sync' ? 'auto' : this.roots.syncFormatRoot?.value || 'json';
    const targetApp = this.roots.syncTargetAppRoot?.value || 'download';
    const resolvedFormat = format === 'auto' ? getPreferredFormatForTargetApp(targetApp) : format;
    const connector = this.connectorRegistry.get('calendar-sync-connector');

    if (!connector) {
      alert('Sync connector is not available.');
      return;
    }

    const payload = {
      state: {
        ...this.state,
        focusDate: this.state.focusDate.toISOString(),
      },
      format,
      targetApp,
      filename: `appointment-state.${resolvedFormat}`,
    };

    try {
      const result = await connector.push(payload);
      if (!result?.ok) {
        alert('Sync failed.');
      }
    } catch {
      alert('Sync failed.');
    }
  }

  navigateHierarchy({ targetView, focusDate }) {
    if (!targetView || !focusDate) return;
    const parsedDate = new Date(focusDate);
    if (Number.isNaN(parsedDate.getTime())) return;

    const allowedTargets = new Set(['month', 'week', 'day']);
    if (!allowedTargets.has(targetView)) return;

    this.state.viewMode = targetView;
    this.state.focusDate = parsedDate;
    this.eventBus.emit('state:updated');
  }

  getCalendarColorMap() {
    const colorMap = new Map();
    this.state.calendars.forEach((calendar) => {
      colorMap.set(calendar.id, calendar.color || '#2563eb');
    });
    return colorMap;
  }

  getFilteredAppointments() {
    const query = (this.state.filters.query || '').trim().toLowerCase();
    const status = this.state.filters.status || 'all';
    const calendarId = this.state.filters.calendarId || 'all';
    const fromDate = this.state.filters.fromDate ? new Date(`${this.state.filters.fromDate}T00:00:00`) : null;
    const toDate = this.state.filters.toDate ? new Date(`${this.state.filters.toDate}T23:59:59`) : null;

    return this.state.appointments.filter((item) => {
      if (status !== 'all' && (item.status || 'confirmed') !== status) return false;
      if (calendarId !== 'all' && (item.calendarId || 'default') !== calendarId) return false;

      const itemDate = new Date(item.date);
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;

      if (!query) return true;
      const text = [
        item.title,
        item.description,
        item.category,
        ...(Array.isArray(item.tags) ? item.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(query);
    });
  }

  startReminderLoop() {
    if (this.reminderTimerId) {
      clearInterval(this.reminderTimerId);
    }
    this.checkReminders();
    this.reminderTimerId = setInterval(() => this.checkReminders(), 30000);
  }

  checkReminders() {
    const now = Date.now();

    this.state.appointments.forEach((appointment) => {
      const minutes = Number(appointment.reminderMinutes);
      if (!Number.isFinite(minutes) || minutes < 0) return;

      const eventTime = new Date(appointment.date).getTime();
      if (!Number.isFinite(eventTime)) return;

      const reminderTime = eventTime - minutes * 60 * 1000;
      const key = `${appointment.id}:${minutes}`;
      if (this.triggeredReminderKeys.has(key)) return;
      if (now < reminderTime || now >= eventTime) return;

      const message = `Reminder: ${appointment.title || 'Appointment'} at ${new Date(appointment.date).toLocaleString()}`;
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification(message);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification(message);
            } else {
              console.info(message);
            }
          });
        } else {
          console.info(message);
        }
      } else {
        console.info(message);
      }

      this.triggeredReminderKeys.add(key);
    });
  }

  /** Re-render list + calendar content without touching the navbar DOM. */
  renderContent() {
    if (this.roots.datetimeRoot) {
      this.roots.datetimeRoot.textContent = formatFocusLabel(this.state.viewMode, this.state.focusDate);
    }

    const filteredAppointments = this.getFilteredAppointments();
    renderAppointmentList(
      this.roots.listRoot,
      filteredAppointments,
      this.getCalendarColorMap(),
      (appointment) => this.openAppointmentDetailsModal(appointment),
    );

    this.calendarController.render({
      root: this.roots.calendarRoot,
      viewMode: this.state.viewMode,
      focusDate: this.state.focusDate,
      appointments: filteredAppointments,
      sortMode: this.state.sortMode,
      onAppointmentClick: (appointment) => this.openAppointmentDetailsModal(appointment),
      onHierarchyNavigate: (payload) => this.navigateHierarchy(payload),
      calendarColorMap: this.getCalendarColorMap(),
    });
  }

  render() {
    renderNavbar(this.roots.navbarRoot, this.state, {
      onOpenNewAppointment: () => this.openAppointmentModal(),
      onOpenCalculator: () => {
        window.location.href = './calendar-calculator/index.html';
      },
      onOpenSyncApp: () => this.openSyncModal('sync'),
      onPrev: () => this.shiftFocusDate(-1),
      onToday: () => {
        this.state.focusDate = new Date();
        this.eventBus.emit('state:updated');
      },
      onNext: () => this.shiftFocusDate(1),
      onViewChange: (mode) => {
        if (!VIEW_MODES.includes(mode)) return;
        this.state.viewMode = mode;
        this.eventBus.emit('state:updated');
      },
      onToggleSort: () => {
        this.state.sortMode =
          this.state.sortMode === SORT_MODES.PRIORITY ? SORT_MODES.DATETIME : SORT_MODES.PRIORITY;
        this.eventBus.emit('state:updated');
      },
      onSaveState: () => this.openSyncModal('save'),
      onOpenLoadState: () => this.openStateLoadModal(),
      onToggleInfo: () => toggleInfoPanel(this.roots.infoRoot),
      onSearchChange: (value) => {
        this.state.filters.query = value;
        this.persist();
        this.renderContent();
      },
      onFilterStatusChange: (value) => {
        this.state.filters.status = value;
        this.persist();
        this.renderContent();
      },
      onFilterCalendarChange: (value) => {
        this.state.filters.calendarId = value;
        this.persist();
        this.renderContent();
      },
      onFilterFromDateChange: (value) => {
        this.state.filters.fromDate = value;
        this.persist();
        this.renderContent();
      },
      onFilterToDateChange: (value) => {
        this.state.filters.toDate = value;
        this.persist();
        this.renderContent();
      },
    });

    this.renderContent();
  }
}
