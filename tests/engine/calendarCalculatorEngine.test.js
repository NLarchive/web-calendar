import { beforeAll, describe, expect, it } from 'vitest';
import { createCalendarCalculatorEngine } from '../../src/core/calendarCalculatorEngine.js';
import { loadCalculatorTemplates } from '../../src/modules/calculator/calculatorTemplates.js';

describe('calendarCalculatorEngine', () => {
  let engine;

  beforeAll(async () => {
    const templates = await loadCalculatorTemplates();
    engine = createCalendarCalculatorEngine(templates);
  });

  it('exposes template metadata and fields', () => {
    const templates = engine.getTemplates();

    expect(templates.find((entry) => entry.id === 'vet-care')).toBeTruthy();
    expect(engine.getFields('pregnancy-care').length).toBeGreaterThan(0);
  });

  it('returns validation errors when required fields are missing', () => {
    const result = engine.calculate('vet-care', {});

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('calculates future reminders for vet care', () => {
    const now = new Date();

    const result = engine.calculate('vet-care', {
      species: 'dog',
      ageYears: 4,
      lastVaccine: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 10).toISOString(),
      lastDeworming: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      lastEctoparasite: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      lastCheckup: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      environment: 'mixed',
    });

    expect(result.ok).toBe(true);
    expect(result.appointments.length).toBeGreaterThan(3);
  });

  it('calculates pregnancy milestone reminders', () => {
    const conception = new Date();
    conception.setDate(conception.getDate() - 20);

    const result = engine.calculate('pregnancy-care', {
      conceptionDate: conception.toISOString(),
      pregnancyWeek: 3,
      highRisk: 'standard',
    });

    expect(result.ok).toBe(true);
    expect(result.appointments.some((item) => item.title.includes('prenatal'))).toBe(true);
  });
});
