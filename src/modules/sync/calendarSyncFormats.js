function escapeICS(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function unescapeICS(value) {
  return String(value || '')
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function splitPipeList(value) {
  if (!value) return [];
  return String(value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinPipeList(value) {
  if (!value) return '';
  const items = Array.isArray(value) ? value : [value];
  return items.map((item) => String(item).trim()).filter(Boolean).join('|');
}

function toICSDateTime(isoDate) {
  const date = new Date(isoDate);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function fromICSDateTime(value) {
  if (!value) return null;
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    const hour = Number(value.slice(9, 11));
    const minute = Number(value.slice(11, 13));
    const second = Number(value.slice(13, 15));
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function recurrenceToRRule(recurrence) {
  switch ((recurrence || '').toLowerCase()) {
    case 'daily':
      return 'FREQ=DAILY';
    case 'weekly':
      return 'FREQ=WEEKLY';
    case 'monthly':
      return 'FREQ=MONTHLY';
    case 'yearly':
      return 'FREQ=YEARLY';
    default:
      return null;
  }
}

function rruleToRecurrence(rrule) {
  if (!rrule) return 'none';
  const match = /FREQ=([^;]+)/i.exec(rrule);
  if (!match) return 'none';
  const freq = match[1].toUpperCase();

  switch (freq) {
    case 'DAILY':
      return 'daily';
    case 'WEEKLY':
      return 'weekly';
    case 'MONTHLY':
      return 'monthly';
    case 'YEARLY':
      return 'yearly';
    default:
      return 'none';
  }
}

function parseDescription(description) {
  const decoded = unescapeICS(description || '');
  const lines = decoded.split('\n');
  const details = {
    description: '',
    category: 'general',
    tags: [],
    contact: [],
    location: '',
    url: '',
    status: 'confirmed',
    attendees: [],
    timezone: 'UTC',
    allDay: false,
    calendarId: 'default',
    reminderMinutes: null,
  };

  for (const line of lines) {
    if (line.startsWith('CATEGORY:')) details.category = line.replace('CATEGORY:', '').trim() || 'general';
    else if (line.startsWith('TAGS:')) details.tags = line.replace('TAGS:', '').split(',').map((v) => v.trim()).filter(Boolean);
    else if (line.startsWith('CONTACT:')) details.contact = line.replace('CONTACT:', '').split(',').map((v) => v.trim()).filter(Boolean);
    else if (line.startsWith('LOCATION:')) details.location = line.replace('LOCATION:', '').trim();
    else if (line.startsWith('URL:')) details.url = line.replace('URL:', '').trim();
    else if (line.startsWith('STATUS:')) details.status = line.replace('STATUS:', '').trim().toLowerCase() || 'confirmed';
    else if (line.startsWith('ATTENDEES:')) {
      details.attendees = line
        .replace('ATTENDEES:', '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    else if (line.startsWith('TIMEZONE:')) details.timezone = line.replace('TIMEZONE:', '').trim() || 'UTC';
    else if (line.startsWith('ALLDAY:')) details.allDay = line.replace('ALLDAY:', '').trim().toLowerCase() === 'true';
    else if (line.startsWith('CALENDARID:')) details.calendarId = line.replace('CALENDARID:', '').trim() || 'default';
    else if (line.startsWith('REMINDERMINUTES:')) {
      const parsedReminder = Number(line.replace('REMINDERMINUTES:', '').trim());
      details.reminderMinutes = Number.isFinite(parsedReminder) && parsedReminder >= 0
        ? Math.round(parsedReminder)
        : null;
    }
    else if (line.startsWith('DETAIL:')) details.description = line.replace('DETAIL:', '').trim();
  }

  if (!details.description) {
    details.description = decoded;
  }

  return details;
}

export function stateToJson(state) {
  return JSON.stringify(state, null, 2);
}

export function stateToCSV(state) {
  const columns = [
    'id',
    'date',
    'endDate',
    'timezone',
    'allDay',
    'recurrence',
    'calendarId',
    'reminderMinutes',
    'recurrenceCount',
    'title',
    'description',
    'location',
    'url',
    'status',
    'contact',
    'attendees',
    'category',
    'tags',
    'priority',
    'createdAt',
  ];

  const rows = (state.appointments || []).map((item) => ({
    id: item.id || '',
    date: item.date || '',
    endDate: item.endDate || '',
    timezone: item.timezone || 'UTC',
    allDay: item.allDay ? 'true' : 'false',
    recurrence: item.recurrence || 'none',
    calendarId: item.calendarId || 'default',
    reminderMinutes: item.reminderMinutes != null ? Number(item.reminderMinutes) : '',
    recurrenceCount: item.recurrenceCount != null ? Number(item.recurrenceCount) : '',
    title: item.title || '',
    description: item.description || '',
    location: item.location || '',
    url: item.url || '',
    status: item.status || 'confirmed',
    contact: joinPipeList(item.contact),
    attendees: joinPipeList(item.attendees),
    category: item.category || 'general',
    tags: joinPipeList(item.tags),
    priority: Number(item.priority) || 1,
    createdAt: item.createdAt || '',
  }));

  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
    '',
  ].join('\n');
}

export function stateToICS(state, options = {}) {
  const prodId = options.prodId || '-//Web Appointment Scheduler//EN';
  const events = (state.appointments || []).map((item) => {
    const uid = item.id || crypto.randomUUID();
    const dtStart = toICSDateTime(item.date);
    const rrule = recurrenceToRRule(item.recurrence);
    const descriptionLines = [
      `DETAIL:${item.description || ''}`,
      `CATEGORY:${item.category || 'general'}`,
      `TAGS:${(item.tags || []).join(',')}`,
      `CONTACT:${(item.contact || []).join(',')}`,
      `TIMEZONE:${item.timezone || 'UTC'}`,
      `ALLDAY:${item.allDay ? 'true' : 'false'}`,
      `CALENDARID:${item.calendarId || 'default'}`,
      `REMINDERMINUTES:${item.reminderMinutes != null ? item.reminderMinutes : ''}`,
      `LOCATION:${item.location || ''}`,
      `URL:${item.url || ''}`,
      `STATUS:${item.status || 'confirmed'}`,
      `ATTENDEES:${(item.attendees || []).join(',')}`,
    ].join('\n');

    return [
      'BEGIN:VEVENT',
      `UID:${escapeICS(uid)}`,
      `DTSTAMP:${toICSDateTime(new Date().toISOString())}`,
      `DTSTART:${dtStart}`,
      item.endDate ? `DTEND:${toICSDateTime(item.endDate)}` : null,
      `X-WEBAPPT-TIMEZONE:${escapeICS(item.timezone || 'UTC')}`,
      `X-WEBAPPT-ALLDAY:${item.allDay ? 'TRUE' : 'FALSE'}`,
      `SUMMARY:${escapeICS(item.title || 'Untitled Appointment')}`,
      `DESCRIPTION:${escapeICS(descriptionLines)}`,
      item.location ? `LOCATION:${escapeICS(item.location)}` : null,
      item.url ? `URL:${escapeICS(item.url)}` : null,
      `STATUS:${escapeICS((item.status || 'confirmed').toUpperCase())}`,
      ...(item.attendees || []).map((attendee) => `ATTENDEE:${escapeICS(attendee)}`),
      `PRIORITY:${Math.max(1, Math.min(10, Number(item.priority) || 1))}`,
      rrule ? `RRULE:${rrule}` : null,
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function parseStateFromJson(jsonText) {
  const parsed = JSON.parse(jsonText || '{}');

  // If the loaded JSON does not include a focusDate (or it's null/empty),
  // treat it as dynamic and use the current date/time so "empty" samples
  // naturally focus on today when loaded.
  if (!parsed.focusDate) {
    parsed.focusDate = new Date().toISOString();
  }

  return parsed;
}

export function parseStateFromICS(icsText) {
  const content = (icsText || '').replace(/\r\n[ \t]/g, '').replace(/\r/g, '');
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);

  const appointments = [];
  let current = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (current?.DTSTART) {
        const details = parseDescription(current.DESCRIPTION || '');
        appointments.push({
          id: current.UID || crypto.randomUUID(),
          date: fromICSDateTime(current.DTSTART) || new Date().toISOString(),
          endDate: fromICSDateTime(current.DTEND) || null,
          recurrence: rruleToRecurrence(current.RRULE),
          title: unescapeICS(current.SUMMARY || 'Untitled Appointment'),
          description: details.description,
          contact: details.contact,
          location: unescapeICS(current.LOCATION || details.location || ''),
          url: unescapeICS(current.URL || details.url || ''),
          status: unescapeICS(current.STATUS || details.status || 'confirmed').toLowerCase(),
          attendees: current.ATTENDEE?.length
            ? current.ATTENDEE.map((attendee) => unescapeICS(attendee))
            : details.attendees,
          timezone: unescapeICS(current['X-WEBAPPT-TIMEZONE'] || details.timezone || 'UTC'),
          allDay: unescapeICS(current['X-WEBAPPT-ALLDAY'] || '').toLowerCase() === 'true' || details.allDay,
          calendarId: details.calendarId || 'default',
          reminderMinutes: details.reminderMinutes,
          category: details.category,
          tags: details.tags,
          priority: Number(current.PRIORITY) || 1,
          createdAt: new Date().toISOString(),
        });
      }
      current = null;
      continue;
    }

    if (!current) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator);
    const value = line.slice(separator + 1);
    if (key === 'ATTENDEE') {
      current.ATTENDEE = current.ATTENDEE || [];
      current.ATTENDEE.push(value);
    } else {
      current[key] = value;
    }
  }

  return {
    appointments,
    viewMode: 'month',
    sortMode: 'priority',
    focusDate: new Date().toISOString(),
  };
}

export function parseStateFromCSV(csvText) {
  const lines = (csvText || '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim());

  if (!lines.length) {
    return {
      appointments: [],
      viewMode: 'month',
      sortMode: 'priority',
      focusDate: new Date().toISOString(),
    };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const appointments = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));

    return {
      id: row.id || crypto.randomUUID(),
      date: row.date || new Date().toISOString(),
      endDate: row.endDate || null,
      recurrence: row.recurrence || 'none',
      timezone: row.timezone || 'UTC',
      allDay: String(row.allDay || '').toLowerCase() === 'true',
      calendarId: row.calendarId || 'default',
      reminderMinutes: row.reminderMinutes === '' ? null : Number(row.reminderMinutes),
      recurrenceCount: row.recurrenceCount === '' ? null : Number(row.recurrenceCount),
      title: row.title || 'Untitled Appointment',
      description: row.description || '',
      location: row.location || '',
      url: row.url || '',
      status: (row.status || 'confirmed').toLowerCase(),
      contact: splitPipeList(row.contact),
      attendees: splitPipeList(row.attendees),
      category: row.category || 'general',
      tags: splitPipeList(row.tags),
      priority: Number(row.priority) || 1,
      createdAt: row.createdAt || new Date().toISOString(),
    };
  });

  return {
    appointments,
    viewMode: 'month',
    sortMode: 'priority',
    focusDate: new Date().toISOString(),
  };
}

export function getPreferredFormatForTargetApp(targetApp) {
  const app = String(targetApp || 'download').toLowerCase();
  if (app === 'google' || app === 'outlook' || app === 'ical' || app === 'apple') return 'ics';
  return 'json';
}

export async function parseCalendarStateFile(file) {
  const text = await file.text();
  const fileName = (file?.name || '').toLowerCase();
  const trimmed = text.trim();

  if (fileName.endsWith('.ics') || trimmed.includes('BEGIN:VCALENDAR')) {
    return parseStateFromICS(text);
  }

  if (fileName.endsWith('.csv') || trimmed.startsWith('id,date,') || trimmed.startsWith('date,')) {
    return parseStateFromCSV(text);
  }

  return parseStateFromJson(text);
}

export function downloadTextFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
