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

  return {
    id: input.id ?? crypto.randomUUID(),
    date: date.toISOString(),
    endDate: endDate ? endDate.toISOString() : null,
    recurrence: normalizedRecurrence,
    title: (input.title || '').trim(),
    description: (input.description || '').trim(),
    location: (input.location || '').trim(),
    url: (input.url || '').trim(),
    status: normalizedStatus,
    attendees: Array.isArray(input.attendees) ? input.attendees : splitByComma(input.attendees),
    contact: Array.isArray(input.contact) ? input.contact : splitByComma(input.contact),
    category: (input.category || 'general').trim(),
    tags: Array.isArray(input.tags) ? input.tags : splitByComma(input.tags),
    priority: normalizedPriority,
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

export function expandRecurringAppointments(appointments, rangeStart, rangeEnd) {
  const expanded = [];

  appointments.forEach((item) => {
    let occurrence = new Date(item.date);

    while (occurrence <= rangeEnd) {
      if (occurrence >= rangeStart) {
        expanded.push({
          ...item,
          occurrenceDate: occurrence.toISOString(),
          sourceId: item.id,
        });
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
