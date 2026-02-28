export const STORAGE_KEY = 'web-appointment-state-v1';

export const VIEW_MODES = ['day', 'week', 'month', 'year', 'agenda'];

export const SORT_MODES = {
  PRIORITY: 'priority',
  DATETIME: 'datetime',
};

export const RECURRENCE = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

export const DEFAULT_CALENDAR_COLOR = '#2563eb';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const MAX_RECURRENCE_COUNT = 365;

export const DEFAULT_CALENDARS = [
  { id: 'default', name: 'Default', color: DEFAULT_CALENDAR_COLOR },
  { id: 'work', name: 'Work', color: '#7c3aed' },
  { id: 'health', name: 'Health', color: '#059669' },
];
