import { BaseConnector } from './baseConnector.js';
import {
  downloadTextFile,
  getPreferredFormatForTargetApp,
  stateToCSV,
  stateToICS,
  stateToJson,
} from '../modules/sync/calendarSyncFormats.js';

function normalizeStateForExport(state) {
  return {
    appointments: state.appointments || [],
    viewMode: state.viewMode || 'month',
    sortMode: state.sortMode || 'priority',
    focusDate: state.focusDate instanceof Date ? state.focusDate.toISOString() : state.focusDate,
  };
}

export class CalendarSyncConnector extends BaseConnector {
  constructor() {
    super('calendar-sync-connector');
  }

  async push(payload) {
    try {
      return this._executePush(payload);
    } catch (err) {
      console.error('CalendarSyncConnector push failed:', err);
      return { ok: false, error: err.message };
    }
  }

  _executePush(payload) {
    const sourcePayload = payload && typeof payload === 'object' ? payload : {};
    const state = normalizeStateForExport(sourcePayload.state || {});
    const targetApp = (sourcePayload.targetApp || 'download').toLowerCase();
    const requestedFormat = (sourcePayload.format || 'json').toLowerCase();
    const format = requestedFormat === 'auto' ? getPreferredFormatForTargetApp(targetApp) : requestedFormat;

    const filenamesByFormat = {
      json: 'appointment-state.json',
      csv: 'appointment-state.csv',
      ics: 'appointment-state.ics',
    };

    const filename = sourcePayload.filename || filenamesByFormat[format] || filenamesByFormat.json;

    if (format === 'ics') {
      const ics = stateToICS(state);
      downloadTextFile(ics, filename, 'text/calendar');
    } else if (format === 'csv') {
      const csv = stateToCSV(state);
      downloadTextFile(csv, filename, 'text/csv');
    } else {
      const json = stateToJson(state);
      downloadTextFile(json, filename, 'application/json');
    }

    if (targetApp === 'google' && typeof window !== 'undefined') {
      window.open('https://calendar.google.com/calendar/u/0/r/settings/export', '_blank', 'noopener,noreferrer');
    } else if (targetApp === 'outlook' && typeof window !== 'undefined') {
      window.open('https://outlook.live.com/calendar/0/addcalendar', '_blank', 'noopener,noreferrer');
    } else if ((targetApp === 'apple' || targetApp === 'ical') && typeof window !== 'undefined') {
      window.open('https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac', '_blank', 'noopener,noreferrer');
    }

    return {
      ok: true,
      format,
      requestedFormat,
      targetApp,
      exportedAppointments: state.appointments.length,
    };
  }
}
