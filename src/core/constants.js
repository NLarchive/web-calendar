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

export const DEFAULT_CALENDARS = [
  { id: 'default', name: 'Default', color: '#2563eb' },
  { id: 'work', name: 'Work', color: '#7c3aed' },
  { id: 'health', name: 'Health', color: '#059669' },
];
