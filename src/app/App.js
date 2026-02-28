import { CacheMemory } from '../core/cacheMemory.js';
import { EventBus } from '../core/eventBus.js';
import { normalizeAppointment } from '../core/schedulerEngine.js';
import { loadFromLocalStorage, saveToLocalStorage } from '../core/storage.js';
import { DEFAULT_CALENDARS, SORT_MODES, VIEW_MODES, DEFAULT_CALENDAR_COLOR } from '../core/constants.js';
import { renderNavbar } from '../modules/ui/navbar.js';
// ... (DEFAULT_PROFESSIONALS will be loaded dynamically below)
import { closeInfoPanel, renderInfoPanel, toggleInfoPanel } from '../modules/ui/infoPanel.js';
import { renderAppointmentDetails } from '../modules/ui/appointmentDetailsPopup.js';
import { renderAppointmentForm } from '../modules/appointments/appointmentForm.js';
import { renderAppointmentList } from '../modules/appointments/appointmentList.js';
import { CalendarController } from '../modules/calendar/calendarController.js';
import { createDefaultConnectorRegistry } from '../connectors/connectorRegistry.js';
import { PluginManager } from '../plugins/pluginManager.js';
import { CalendarCalculatorPlugin } from '../plugins/calendarCalculatorPlugin.js';
import { getPreferredFormatForTargetApp, parseCalendarStateFile } from '../modules/sync/calendarSyncFormats.js';
import { getDetectedTimeZone, normalizeTimeZone } from '../core/dateUtils.js';
import { showToast } from '../core/sanitize.js';
import { buildProfessionalContactList } from '../modules/professional/professionalContacts.js';
import {
  applyStaticTranslations,
  getLanguage,
  getLocale,
  setLanguage,
  t,
} from '../i18n/index.js';



/**
 * Load professional defaults safely if the configuration file is present.
 * @returns {Promise<any[]>}
 */
async function loadDefaultProfessionals() {
  try {
    const mod = await import('../config/professionalDefaults.js');
    return Array.isArray(mod.DEFAULT_PROFESSIONALS) ? mod.DEFAULT_PROFESSIONALS : [];
  } catch {
    return [];
  }
}

// Top-level await for configuration. App.js will only be ready once this resolves.
const DEFAULT_PROFESSIONALS = await loadDefaultProfessionals();



const SAMPLE_FILES = {
  vet: [
    { value: 'dog-vet-care-state.json', labelKey: 'stateLoad.sampleDog' },
    { value: 'cat-vet-care-state.json', labelKey: 'stateLoad.sampleCat' }
  ],
  pregnancy: [
    { value: 'pregnancy-care-state.json', labelKey: 'stateLoad.samplePregnancy' }
  ]
};

const COUNTRY_LABELS = {
  global: 'stateLoad.globalProfile',
  chile: 'stateLoad.chileProfile',
};

function getDetectedCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'America/Santiago') return 'chile';
    const lang = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
    if (lang.startsWith('es-CL')) return 'chile';
  } catch { /* ignore */ }
  return 'global';
}

function normalizeSampleState(nextState) {
  const safeState = nextState && typeof nextState === 'object' ? nextState : {};

  // If professionals are explicitly defined in the state, use them; otherwise, use defaults.
  // This allows samples to override defaults if they WANT to, but otherwise they stay thin.
  const professionals = Array.isArray(safeState.professionals) && safeState.professionals.length
    ? safeState.professionals
    : DEFAULT_PROFESSIONALS;

  const professionalsById = new Map(professionals.map((item) => [item.id, item]));
  const detectedTimezone = normalizeTimeZone(getDetectedTimeZone());

  const appointments = Array.isArray(safeState.appointments)
    ? safeState.appointments.map((item) => {
      const nextProfessionalId = item.professionalId || (professionals.length > 0 ? professionals[0].id : undefined);
      const professional = professionalsById.get(nextProfessionalId) || null;

      if (!professional) {
        return {
          ...item,
          timezone: item.timezone || detectedTimezone,
        };
      }

      // If we found a professional, we ensure the appointment has the latest contact data from it.
      // This is the "loading defaults" part.
      return {
        ...item,
        professionalId: nextProfessionalId,
        timezone: item.timezone || detectedTimezone,
        location: item.location || professional.address || '',
        url: item.url || professional.website || '',
        contact: (Array.isArray(item.contact) && item.contact.length > 0)
          ? item.contact
          : buildProfessionalContactList(professional),
      };
    })
    : [];

  return {
    ...safeState,
    professionals,
    appointments,
  };
}

function formatFocusLabel(viewMode, focusDate) {
  // concise label for the calendar header (used in #current-datetime)
  if (!focusDate || !(focusDate instanceof Date)) return '';

  if (viewMode === 'day') {
    return focusDate.toLocaleDateString(getLocale(), { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (viewMode === 'week') {
    const start = new Date(focusDate);
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return t('appMessages.weekRange', {
      start: start.toLocaleDateString(getLocale()),
      end: end.toLocaleDateString(getLocale()),
    });
  }

  if (viewMode === 'year') {
    return t('appMessages.year', { year: focusDate.getFullYear() });
  }

  // month
  return focusDate.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' });
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
      professionals: Array.isArray(persisted?.professionals) && persisted.professionals.length
        ? persisted.professionals
        : DEFAULT_PROFESSIONALS,
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
    this.monthRotated = false;
  }

  start() {
    this.bindEventListeners();
    this.bindModalFocusTraps();
    this.render();
    renderInfoPanel(this.roots.infoRoot, {
      onClose: () => closeInfoPanel(this.roots.infoRoot),
    });
    applyStaticTranslations(document);
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

    this.roots.stateLoadSampleFolderRoot?.addEventListener('change', () => {
      this.updateSampleDropdown();
    });

    this.roots.stateLoadSampleRoot?.addEventListener('change', () => {
      this.updateSampleCountryPreview();
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

    this.roots.toggleMonthRotateButton?.addEventListener('click', () => {
      this.monthRotated = !this.monthRotated;
      this.renderContent();
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
          showToast(error?.message || t('appMessages.unableToSaveAppointment'), 'error');
        }
      },
      {
        mode: appointment ? 'edit' : 'create',
        appointment,
        calendarOptions: this.state.calendars,
        professionalOptions: this.state.professionals,
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
    const normalized = normalizeSampleState(nextState);
    const parsedFocusDate = normalized.focusDate ? new Date(normalized.focusDate) : this.state.focusDate;
    const focusDate = Number.isNaN(parsedFocusDate.getTime()) ? this.state.focusDate : parsedFocusDate;

    this.state = {
      ...this.state,
      ...normalized,
      appointments: Array.isArray(normalized.appointments) ? normalized.appointments : this.state.appointments,
      calendars: Array.isArray(normalized.calendars) && normalized.calendars.length ? normalized.calendars : this.state.calendars,
      professionals: Array.isArray(normalized.professionals) && normalized.professionals.length ? normalized.professionals : this.state.professionals,
      filters: {
        ...this.state.filters,
        ...(normalized.filters || {}),
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
      showToast(t('appMessages.unableToSaveLocalStorage'), 'error');
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
      title.textContent = this.editingAppointmentId ? t('app.editAppointment') : t('app.newAppointment');
    }
    this.roots.formRoot?.querySelector('input,select,textarea,button')?.focus();
  }

  closeAppointmentModal() {
    this.editingAppointmentId = null;
    this.roots.modalRoot?.classList.add('hidden');
  }

  openAppointmentDetailsModal(appointment) {
    this.selectedAppointmentId = appointment?.sourceId || appointment?.id || null;
    renderAppointmentDetails(this.roots.detailsContentRoot, appointment, {
      professionals: this.state.professionals,
    });
    this.roots.detailsContentRoot?.querySelector('[data-action="edit-appointment"]')?.addEventListener('click', () => {
      this.closeAppointmentDetailsModal();
      if (!this.selectedAppointmentId) return;
      this.editingAppointmentId = this.selectedAppointmentId;
      this.openAppointmentModal();
    });
    this.roots.detailsContentRoot?.querySelector('[data-action="delete-appointment"]')?.addEventListener('click', () => {
      if (!this.selectedAppointmentId) return;
      const confirmed = typeof window.confirm !== 'function' || window.confirm(t('appMessages.deleteConfirm'));
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
      this.roots.syncActionLabelRoot.value = mode === 'save' ? t('sync.saveState') : t('sync.sync');
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
    const countryRoot = this.roots.stateLoadSampleCountryRoot;
    if (countryRoot?.tagName === 'SELECT') {
      countryRoot.value = getDetectedCountry();
    }
    this.updateStateLoadSourceUI();
  }

  closeStateLoadModal() {
    this.roots.stateLoadModalRoot?.classList.add('hidden');
  }

  updateStateLoadSourceUI() {
    const source = this.roots.stateLoadSourceRoot?.value || 'sample';
    if (this.roots.sampleStateFieldsRoot) {
      this.roots.sampleStateFieldsRoot.classList.toggle('hidden', source !== 'sample');
      if (source === 'sample') {
        this.updateSampleDropdown();
      }
    }
    if (this.roots.customStateFieldsRoot) {
      this.roots.customStateFieldsRoot.classList.toggle('hidden', source !== 'custom');
    }
  }

  updateSampleDropdown() {
    const folder = this.roots.stateLoadSampleFolderRoot?.value || 'vet';
    const sampleSelect = this.roots.stateLoadSampleRoot;
    if (!sampleSelect) return;

    sampleSelect.innerHTML = '';
    const options = SAMPLE_FILES[folder] || [];
    options.forEach((opt) => {
      const optionEl = document.createElement('option');
      optionEl.value = opt.value;
      optionEl.textContent = t(opt.labelKey);
      sampleSelect.appendChild(optionEl);
    });

    this.updateSampleCountryPreview();
  }

  getSampleBaseUrl() {
    const isGitHubPages = window.location.hostname === 'nlarchive.github.io';
    return isGitHubPages
      ? 'https://raw.githubusercontent.com/NLarchive/web-calendar/main/data/calendar-template/'
      : './data/calendar-template/';
  }

  /**
   * Builds the URL for a localized sample file.
   */
  getSampleStringsUrl(sampleFolder, sampleName) {
    const lang = getLanguage() === 'es' ? 'es' : 'en';
    return `${this.getSampleBaseUrl()}${sampleFolder}/languages/${lang}/${sampleName}`;
  }

  /**
   * Builds the URL for a common sample file at the topic root.
   */
  getSampleCommonUrl(sampleFolder, sampleName) {
    return `${this.getSampleBaseUrl()}${sampleFolder}/${sampleName}`;
  }

  async fetchSampleState(sampleFolder, sampleName) {
    const commonUrl = this.getSampleCommonUrl(sampleFolder, sampleName);
    const stringsUrl = this.getSampleStringsUrl(sampleFolder, sampleName);
    const FETCH_TIMEOUT = 10000;

    const fetchWithTimeout = (url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
    };

    try {
      const [commonRes, stringsRes] = await Promise.all([
        fetchWithTimeout(commonUrl),
        fetchWithTimeout(stringsUrl).catch(() => null), // strings might not exist for some samples
      ]);

      if (!commonRes.ok) throw new Error('Failed to load common sample state');
      const commonData = await commonRes.json();
      const stringsData = (stringsRes && stringsRes.ok) ? await stringsRes.json() : null;

      if (!stringsData) return commonData;

      // Merge strings into common data.
      // We look at appointments and calendars for translatable strings.
      if (Array.isArray(commonData.appointments) && Array.isArray(stringsData.appointments)) {
        const stringsById = new Map(stringsData.appointments.map((a) => [a.id, a]));
        commonData.appointments = commonData.appointments.map((a) => {
          const strings = stringsById.get(a.id);
          if (!strings) return a;
          return {
            ...a,
            title: strings.title || a.title,
            description: strings.description || a.description,
          };
        });
      }

      if (Array.isArray(commonData.calendars) && Array.isArray(stringsData.calendars)) {
        const stringsById = new Map(stringsData.calendars.map((c) => [c.id, c]));
        commonData.calendars = commonData.calendars.map((c) => {
          const strings = stringsById.get(c.id);
          if (!strings) return c;
          return {
            ...c,
            name: strings.name || c.name,
          };
        });
      }

      return commonData;
    } catch (error) {
      console.error('Error fetching sample state:', error);
      throw error;
    }
  }

  async updateSampleCountryPreview() {
    const countryRoot = this.roots.stateLoadSampleCountryRoot;
    if (!countryRoot) return;

    const sampleFolder = this.roots.stateLoadSampleFolderRoot?.value || 'vet';
    const sampleName = this.roots.stateLoadSampleRoot?.value;
    if (!sampleName) {
      if (countryRoot.tagName === 'SELECT') countryRoot.value = getDetectedCountry();
      else countryRoot.value = '-';
      return;
    }

    try {
      const sampleState = await this.fetchSampleState(sampleFolder, sampleName);
      const countryKey = sampleState?.sampleMeta?.country || sampleState?.country || 'global';
      if (countryRoot.tagName === 'SELECT') {
        countryRoot.value = countryKey;
        if (!countryRoot.value) countryRoot.value = 'global';
      } else {
        countryRoot.value = t(COUNTRY_LABELS[countryKey] || '', {}, String(countryKey));
      }
    } catch {
      if (countryRoot.tagName === 'SELECT') {
        countryRoot.value = getDetectedCountry();
      } else {
        countryRoot.value = t('app.unknown');
      }
    }
  }

  confirmStateReplacement() {
    const message = t('stateLoad.confirmReplacement');
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
          showToast(t('stateLoad.selectStateFile'), 'error');
          return;
        }

        const nextState = await parseCalendarStateFile(file);
        this.applyLoadedState(nextState);
        this.closeStateLoadModal();
        return;
      }

      const sampleName = this.roots.stateLoadSampleRoot?.value;
      const sampleFolder = this.roots.stateLoadSampleFolderRoot?.value || 'vet';
      if (!sampleName) {
        showToast(t('stateLoad.selectSampleState'), 'error');
        return;
      }

      const nextState = await this.fetchSampleState(sampleFolder, sampleName);
      this.applyLoadedState(nextState);
      this.closeStateLoadModal();
    } catch (error) {
      if (source === 'custom') {
        showToast(t('stateLoad.invalidStateFile'), 'error');
        return;
      }

      showToast(t('stateLoad.failedToLoadState', { message: error?.message || t('appMessages.unknownError') }), 'error');
    }
  }

  async runSyncFlow() {
    const format = this.syncMode === 'sync' ? 'auto' : this.roots.syncFormatRoot?.value || 'json';
    const targetApp = this.roots.syncTargetAppRoot?.value || 'download';
    const resolvedFormat = format === 'auto' ? getPreferredFormatForTargetApp(targetApp) : format;
    const connector = this.connectorRegistry.get('calendar-sync-connector');

    if (!connector) {
      showToast(t('sync.connectorUnavailable'), 'error');
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
        showToast(t('sync.syncFailed'), 'error');
      }
    } catch {
      showToast(t('sync.syncFailed'), 'error');
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
      colorMap.set(calendar.id, calendar.color || DEFAULT_CALENDAR_COLOR);
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

      const message = t('appMessages.reminder', {
        title: appointment.title || t('appMessages.appointment'),
        when: new Date(appointment.date).toLocaleString(getLocale()),
      });
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

    // Show/hide rotate button based on view mode
    if (this.roots.toggleMonthRotateButton) {
      this.roots.toggleMonthRotateButton.classList.toggle('hidden', this.state.viewMode !== 'month');
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
      monthRotated: this.monthRotated,
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
      onLanguageChange: (language) => {
        setLanguage(language);
        this.updateSampleDropdown();
        applyStaticTranslations(document);
        this.render();
      },
    });

    this.renderContent();
  }
}
