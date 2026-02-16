import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  parseInputDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from './dateUtils.js';
import { RECURRENCE, SORT_MODES } from './constants.js';

export function normalizeAppointment(input) {
  const date = parseInputDate(input.date);
  if (!date) throw new Error('Invalid appointment date');
  const endDate = parseInputDate(input.endDate);
  if (endDate && endDate < date) throw new Error('End date must be after start date');

  const normalizedRecurrence = Object.values(RECURRENCE).includes(input.recurrence)
    ? input.recurrence
    : RECURRENCE.NONE;

  const normalizedStatus = ['confirmed', 'tentative', 'cancelled'].includes((input.status || '').toLowerCase())
    ? String(input.status).toLowerCase()
    : 'confirmed';

  const parsedPriority = Number(input.priority);
  const normalizedPriority = Number.isFinite(parsedPriority)
    ? Math.max(1, Math.min(10, Math.round(parsedPriority)))
    : 1;

  const parsedReminder = Number(input.reminderMinutes);
  const normalizedReminderMinutes = Number.isFinite(parsedReminder) && parsedReminder >= 0
    ? Math.round(parsedReminder)
    : null;

  const parsedRecurrenceCount = Number(input.recurrenceCount);
  const normalizedRecurrenceCount = Number.isFinite(parsedRecurrenceCount) && parsedRecurrenceCount > 0
    ? Math.round(parsedRecurrenceCount)
    : null;

  const timezone = String(
    input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  ).trim();

  const allDay =
    input.allDay === true ||
    input.allDay === 'true' ||
    input.allDay === 'on' ||
    input.allDay === 1 ||
    input.allDay === '1';

  return {
    id: input.id ?? crypto.randomUUID(),
    date: date.toISOString(),
    endDate: endDate ? endDate.toISOString() : null,
    recurrence: normalizedRecurrence,
    title: (input.title || '').trim() || 'Untitled',
    description: (input.description || '').trim(),
    location: (input.location || '').trim(),
    url: (input.url || '').trim(),
    status: normalizedStatus,
    attendees: Array.isArray(input.attendees) ? input.attendees : splitByComma(input.attendees),
    contact: Array.isArray(input.contact) ? input.contact : splitByComma(input.contact),
    category: (input.category || 'general').trim(),
    tags: Array.isArray(input.tags) ? input.tags : splitByComma(input.tags),
    priority: normalizedPriority,
    allDay,
    timezone,
    calendarId: String(input.calendarId || 'default').trim() || 'default',
    reminderMinutes: normalizedReminderMinutes,
    recurrenceCount: normalizedRecurrenceCount,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function splitByComma(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function shiftByRecurrence(date, recurrence) {
  const shifted = new Date(date);

  switch (recurrence) {
    case RECURRENCE.DAILY:
      shifted.setDate(shifted.getDate() + 1);
      break;
    case RECURRENCE.WEEKLY:
      shifted.setDate(shifted.getDate() + 7);
      break;
    case RECURRENCE.MONTHLY:
      shifted.setMonth(shifted.getMonth() + 1);
      break;
    case RECURRENCE.YEARLY:
      shifted.setFullYear(shifted.getFullYear() + 1);
      break;
    default:
      shifted.setFullYear(3000);
  }

  return shifted;
}

const MAX_EXPANSION = 1000;

export function expandRecurringAppointments(appointments, rangeStart, rangeEnd) {
  const expanded = [];

  appointments.forEach((item) => {
    let occurrence = new Date(item.date);
    let iterations = 0;
    let emittedOccurrences = 0;
    const recurrenceCountLimit = Number(item.recurrenceCount);
    const hasRecurrenceCountLimit = Number.isFinite(recurrenceCountLimit) && recurrenceCountLimit > 0;

    while (occurrence <= rangeEnd && iterations < MAX_EXPANSION) {
      iterations += 1;

      if (hasRecurrenceCountLimit && emittedOccurrences >= recurrenceCountLimit) {
        break;
      }

      if (occurrence >= rangeStart) {
        expanded.push({
          ...item,
          occurrenceDate: occurrence.toISOString(),
          sourceId: item.id,
        });
        emittedOccurrences += 1;
      }

      if (!item.recurrence || item.recurrence === RECURRENCE.NONE) break;
      occurrence = shiftByRecurrence(occurrence, item.recurrence);
    }
  });

  return expanded;
}

export function sortAppointments(items, mode = SORT_MODES.PRIORITY) {
  const list = [...items];

  if (mode === SORT_MODES.DATETIME) {
    return list.sort((a, b) => new Date(a.occurrenceDate || a.date) - new Date(b.occurrenceDate || b.date));
  }

  return list.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(a.occurrenceDate || a.date) - new Date(b.occurrenceDate || b.date);
  });
}

export function getRangeByView(date, viewMode) {
  switch (viewMode) {
    case 'day':
      return [startOfDay(date), endOfDay(date)];
    case 'week':
      return [startOfWeek(date), endOfWeek(date)];
    case 'year':
      return [startOfYear(date), endOfYear(date)];
    case 'month':
    default:
      return [startOfMonth(date), endOfMonth(date)];
  }
}
