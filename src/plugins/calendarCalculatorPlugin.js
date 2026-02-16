import { DEFAULT_CALENDARS, STORAGE_KEY } from '../core/constants.js';
import { normalizeAppointment } from '../core/schedulerEngine.js';

export const CALCULATOR_IMPORT_STORAGE_KEY = 'web-appointment-calculator-import-v1';

function parseJsonSafely(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeCalendars(existingCalendars = [], incomingCalendars = []) {
  const byId = new Map();
  [...DEFAULT_CALENDARS, ...existingCalendars, ...incomingCalendars].forEach((calendar) => {
    if (!calendar?.id) return;
    byId.set(calendar.id, {
      id: String(calendar.id),
      name: String(calendar.name || calendar.id),
      color: String(calendar.color || '#2563eb'),
    });
  });
  return [...byId.values()];
}

function normalizeAppointments(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((entry) => {
      try {
        return normalizeAppointment(entry);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function mergeAppointments(existingAppointments = [], incomingAppointments = []) {
  const byId = new Map();

  existingAppointments.forEach((item) => {
    if (!item?.id) return;
    byId.set(item.id, item);
  });

  incomingAppointments.forEach((item) => {
    if (!item?.id) return;
    byId.set(item.id, item);
  });

  return [...byId.values()];
}

function queueImportPayload(payload) {
  try {
    localStorage.setItem(CALCULATOR_IMPORT_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function clearQueuedImport() {
  try {
    localStorage.removeItem(CALCULATOR_IMPORT_STORAGE_KEY);
  } catch {
    // no-op
  }
}

function readQueuedImport() {
  try {
    return parseJsonSafely(localStorage.getItem(CALCULATOR_IMPORT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export class CalendarCalculatorPlugin {
  applyImport(app, payload, options = {}) {
    if (!app || !payload) return false;

    const normalizedIncoming = normalizeAppointments(payload.appointments);
    if (!normalizedIncoming.length) return false;

    const existingAppointments = Array.isArray(app.state?.appointments) ? app.state.appointments : [];
    const existingCalendars = Array.isArray(app.state?.calendars) ? app.state.calendars : DEFAULT_CALENDARS;

    const mergedAppointments = options.replace
      ? normalizedIncoming
      : mergeAppointments(existingAppointments, normalizedIncoming);
    const mergedCalendars = mergeCalendars(existingCalendars, payload.calendars);

    app.applyLoadedState({
      appointments: mergedAppointments,
      calendars: mergedCalendars,
      viewMode: app.state.viewMode,
      sortMode: app.state.sortMode,
      focusDate: new Date().toISOString(),
    });

    return true;
  }

  consumeQueuedImport(app) {
    const queued = readQueuedImport();
    if (!queued) return;

    const imported = this.applyImport(app, queued, { replace: false });
    if (imported) {
      clearQueuedImport();
    }
  }

  exposeRuntimeApi(app) {
    if (typeof window === 'undefined') return;

    window.__CALENDAR_CALCULATOR_PLUGIN__ = {
      queueImport: queueImportPayload,
      importNow: (payload, options = {}) => this.applyImport(app, payload, options),
      pendingKey: CALCULATOR_IMPORT_STORAGE_KEY,
      appStateKey: STORAGE_KEY,
    };
  }

  onAppReady({ app }) {
    this.exposeRuntimeApi(app);
    this.consumeQueuedImport(app);
  }
}

export function queueCalendarCalculatorImport(payload) {
  return queueImportPayload(payload);
}
