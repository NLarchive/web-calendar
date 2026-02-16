import { describe, expect, it } from 'vitest';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  formatDateTime,
  parseInputDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toLocalDateTimeInput,
} from '../../src/core/dateUtils.js';

describe('dateUtils', () => {
  describe('parseInputDate', () => {
    it('parses DD/MM/YYYY format', () => {
      const result = parseInputDate('15/02/2026');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15);
    });

    it('parses ISO 8601 format', () => {
      const result = parseInputDate('2026-02-15T10:00:00.000Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
    });

    it('returns null for empty/falsy input', () => {
      expect(parseInputDate('')).toBeNull();
      expect(parseInputDate(null)).toBeNull();
      expect(parseInputDate(undefined)).toBeNull();
    });

    it('returns null for invalid date string', () => {
      expect(parseInputDate('not-a-date')).toBeNull();
    });

    it('returns null for malformed DD/MM/YYYY', () => {
      expect(parseInputDate('00/00/0000')).toBeNull();
    });
  });

  describe('toLocalDateTimeInput', () => {
    it('formats date to datetime-local input value', () => {
      const date = new Date(2026, 1, 15, 10, 30);
      const result = toLocalDateTimeInput(date);
      expect(result).toBe('2026-02-15T10:30');
    });

    it('pads single-digit months and hours', () => {
      const date = new Date(2026, 0, 5, 8, 5);
      const result = toLocalDateTimeInput(date);
      expect(result).toBe('2026-01-05T08:05');
    });
  });

  describe('formatDateTime', () => {
    it('returns a string containing date and time', () => {
      const date = new Date(2026, 1, 15, 14, 30);
      const result = formatDateTime(date);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(5);
    });
  });

  describe('range helpers', () => {
    const date = new Date(2026, 1, 15, 14, 30, 45);

    it('startOfDay zeroes time components', () => {
      const start = startOfDay(date);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getDate()).toBe(15);
    });

    it('endOfDay sets time to 23:59:59.999', () => {
      const end = endOfDay(date);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });

    it('startOfWeek returns Monday', () => {
      const start = startOfWeek(date);
      expect(start.getDay()).toBe(1); // Monday
    });

    it('endOfWeek returns Sunday', () => {
      const end = endOfWeek(date);
      expect(end.getDay()).toBe(0); // Sunday
    });

    it('startOfMonth returns first day', () => {
      expect(startOfMonth(date).getDate()).toBe(1);
    });

    it('endOfMonth returns last day of month', () => {
      const end = endOfMonth(date);
      expect(end.getDate()).toBe(28); // Feb 2026
      expect(end.getHours()).toBe(23);
    });

    it('startOfYear returns Jan 1', () => {
      const start = startOfYear(date);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
    });

    it('endOfYear returns Dec 31', () => {
      const end = endOfYear(date);
      expect(end.getMonth()).toBe(11);
      expect(end.getDate()).toBe(31);
    });
  });
});
