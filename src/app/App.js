import { CacheMemory } from '../core/cacheMemory.js';
import { EventBus } from '../core/eventBus.js';
import { normalizeAppointment } from '../core/schedulerEngine.js';
import { loadFromLocalStorage, saveToLocalStorage } from '../core/storage.js';
import { SORT_MODES, VIEW_MODES } from '../core/constants.js';
import { renderNavbar } from '../modules/ui/navbar.js';
import { closeInfoPanel, renderInfoPanel, toggleInfoPanel } from '../modules/ui/infoPanel.js';
import { renderAppointmentDetails } from '../modules/ui/appointmentDetailsPopup.js';
import { renderAppointmentForm } from '../modules/appointments/appointmentForm.js';
import { renderAppointmentList } from '../modules/appointments/appointmentList.js';
import { CalendarController } from '../modules/calendar/calendarController.js';
import { createDefaultConnectorRegistry } from '../connectors/connectorRegistry.js';
import { PluginManager } from '../plugins/pluginManager.js';
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
    };

    this.syncMode = 'sync';
  }

  start() {
    this.bindEventListeners();
    this.render();
    renderInfoPanel(this.roots.infoRoot, {
      onClose: () => closeInfoPanel(this.roots.infoRoot),
    });

    // NOTE: `#current-datetime` shows the calendar focus (view + date) — updated in render().
  }

  bindEventListeners() {
    renderAppointmentForm(this.roots.formRoot, async (rawData) => {
      try {
        const appointment = normalizeAppointment(rawData);
        await this.pluginManager.emit('beforeAppointmentCreate', appointment);
        this.state.appointments.push(appointment);
        await this.pluginManager.emit('afterAppointmentCreate', appointment);
        this.persist();
        this.render();
        this.closeAppointmentModal();
      } catch (error) {
        alert(error?.message || 'Unable to create appointment.');
      }
    });

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

    this.eventBus.on('state:updated', () => {
      this.persist();
      this.render();
    });

    this.updateStateLoadSourceUI();
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
    this.roots.modalRoot?.classList.remove('hidden');
  }

  closeAppointmentModal() {
    this.roots.modalRoot?.classList.add('hidden');
  }

  openAppointmentDetailsModal(appointment) {
    renderAppointmentDetails(this.roots.detailsContentRoot, appointment);
    this.roots.detailsModalRoot?.classList.remove('hidden');
  }

  closeAppointmentDetailsModal() {
    this.roots.detailsModalRoot?.classList.add('hidden');
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

  render() {
    // update the calendar header focus label
    if (this.roots.datetimeRoot) {
      this.roots.datetimeRoot.textContent = formatFocusLabel(this.state.viewMode, this.state.focusDate);
    }

    renderNavbar(this.roots.navbarRoot, this.state, {
      onOpenNewAppointment: () => this.openAppointmentModal(),
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
    });

    renderAppointmentList(this.roots.listRoot, this.state.appointments);

    this.calendarController.render({
      root: this.roots.calendarRoot,
      viewMode: this.state.viewMode,
      focusDate: this.state.focusDate,
      appointments: this.state.appointments,
      sortMode: this.state.sortMode,
      onAppointmentClick: (appointment) => this.openAppointmentDetailsModal(appointment),
      onHierarchyNavigate: (payload) => this.navigateHierarchy(payload),
    });
  }
}
