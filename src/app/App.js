import { CacheMemory } from '../core/cacheMemory.js';
import { EventBus } from '../core/eventBus.js';
import { normalizeAppointment } from '../core/schedulerEngine.js';
import { loadFromLocalStorage, loadStateFromFile, saveStateToFile, saveToLocalStorage } from '../core/storage.js';
import { SORT_MODES } from '../core/constants.js';
import { renderNavbar } from '../modules/ui/navbar.js';
import { closeInfoPanel, renderInfoPanel, toggleInfoPanel } from '../modules/ui/infoPanel.js';
import { renderAppointmentDetails } from '../modules/ui/appointmentDetailsPopup.js';
import { renderAppointmentForm } from '../modules/appointments/appointmentForm.js';
import { renderAppointmentList } from '../modules/appointments/appointmentList.js';
import { CalendarController } from '../modules/calendar/calendarController.js';
import { createDefaultConnectorRegistry } from '../connectors/connectorRegistry.js';
import { PluginManager } from '../plugins/pluginManager.js';



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

    this.state = {
      appointments: persisted?.appointments || [],
      viewMode: persisted?.viewMode || 'month',
      sortMode: persisted?.sortMode || SORT_MODES.PRIORITY,
      focusDate: persisted?.focusDate ? new Date(persisted.focusDate) : new Date(),
    };
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
      const appointment = normalizeAppointment(rawData);
      await this.pluginManager.emit('beforeAppointmentCreate', appointment);
      this.state.appointments.push(appointment);
      await this.pluginManager.emit('afterAppointmentCreate', appointment);
      this.persist();
      this.render();
      this.closeAppointmentModal();
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

    this.eventBus.on('state:updated', () => {
      this.persist();
      this.render();
    });
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

  async handleStateLoad(file) {
    try {
      const nextState = await loadStateFromFile(file);
      this.state = {
        ...this.state,
        ...nextState,
        focusDate: nextState.focusDate ? new Date(nextState.focusDate) : this.state.focusDate,
      };
      this.eventBus.emit('state:updated');
    } catch {
      alert('Invalid state file');
    }
  }

  persist() {
    const stateToStore = {
      ...this.state,
      focusDate: this.state.focusDate.toISOString(),
    };

    this.cache.set('state', stateToStore);
    saveToLocalStorage(stateToStore);
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
      onPrev: () => this.shiftFocusDate(-1),
      onToday: () => {
        this.state.focusDate = new Date();
        this.eventBus.emit('state:updated');
      },
      onNext: () => this.shiftFocusDate(1),
      onViewChange: (mode) => {
        this.state.viewMode = mode;
        this.eventBus.emit('state:updated');
      },
      onToggleSort: () => {
        this.state.sortMode =
          this.state.sortMode === SORT_MODES.PRIORITY ? SORT_MODES.DATETIME : SORT_MODES.PRIORITY;
        this.eventBus.emit('state:updated');
      },
      onSaveState: () => saveStateToFile(this.state),
      onLoadState: (file) => this.handleStateLoad(file),
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
