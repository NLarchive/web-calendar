const TEMPLATE_FILES = [
  '../../../data/calendar-template/vet/vet-calendar.json',
  '../../../data/calendar-template/pregnancy/pregnancy-calendar.json',
];

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addWeeks(date, weeks) {
  return addDays(date, weeks * 7);
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function fillTemplate(templateString, variables) {
  if (!templateString) return '';
  return String(templateString).replace(/\{([^}]+)\}/g, (_, key) => {
    const value = variables[key.trim()];
    return value == null ? '' : String(value);
  });
}

function getFieldOptionLabel(fields, fieldName, value) {
  const field = fields.find((entry) => entry.name === fieldName);
  const option = field?.options?.find((entry) => entry.value === value);
  return option?.label || value || '';
}

function evaluateConditions(conditions = [], input, derivedDates) {
  return conditions.every((condition) => {
    if (!condition || !condition.field) return true;

    const value = input[condition.field];

    if (Array.isArray(condition.in)) {
      return condition.in.includes(value);
    }

    if (Array.isArray(condition.notIn)) {
      return !condition.notIn.includes(value);
    }

    if (Object.prototype.hasOwnProperty.call(condition, 'equals')) {
      return value === condition.equals;
    }

    if (Object.prototype.hasOwnProperty.call(condition, 'notEquals')) {
      return value !== condition.notEquals;
    }

    if (condition.kind === 'missingDate') {
      return !parseDate(value);
    }

    if (condition.kind === 'dateOlderThanDaysBeforeAnchor') {
      const dateValue = parseDate(value);
      const anchorValue = derivedDates[condition.anchor] ? parseDate(derivedDates[condition.anchor]) : null;
      if (!anchorValue) return false;
      if (!dateValue) return true;
      return dateValue.getTime() < addDays(anchorValue, -Math.abs(Number(condition.days) || 0)).getTime();
    }

    return true;
  });
}

function resolveDerivedDates(templateData, input) {
  const derived = {};
  const definitions = Array.isArray(templateData.derivedDates) ? templateData.derivedDates : [];

  definitions.forEach((definition) => {
    let base = null;

    if (definition.fromField) {
      base = parseDate(input[definition.fromField]);
    }

    if (!base && definition.fromDerived) {
      base = parseDate(derived[definition.fromDerived]);
    }

    if (!base && definition.fallbackFromAgeYearsField) {
      const ageYears = Number(input[definition.fallbackFromAgeYearsField]);
      if (Number.isFinite(ageYears) && ageYears >= 0) {
        base = addDays(new Date(), Math.round(-ageYears * 365.25));
      }
    }

    if (!base) {
      derived[definition.name] = null;
      return;
    }

    let dateValue = new Date(base);
    if (Number.isFinite(definition.addDays)) dateValue = addDays(dateValue, definition.addDays);
    if (Number.isFinite(definition.addWeeks)) dateValue = addWeeks(dateValue, definition.addWeeks);
    if (Number.isFinite(definition.addMonths)) dateValue = addMonths(dateValue, definition.addMonths);

    derived[definition.name] = dateValue.toISOString();
  });

  return derived;
}

function resolveAnchorDate(anchor, input, derivedDates) {
  if (!anchor) return null;
  const fromInput = parseDate(input[anchor]);
  if (fromInput) return fromInput;
  const fromDerived = parseDate(derivedDates[anchor]);
  return fromDerived;
}

function createEventItems(event, context) {
  const { input, derivedDates, templateData, windowStart, windowEnd } = context;

  if (!evaluateConditions(event.conditions, input, derivedDates)) {
    return [];
  }

  const schedule = event.schedule || {};
  const mode = schedule.mode || 'single';
  const anchorDate = resolveAnchorDate(schedule.anchor, input, derivedDates);
  if (!anchorDate) return [];

  const entityName = input.petName || input.personName || '';
  const speciesLabel = getFieldOptionLabel(templateData.fields || [], 'species', input.species);

  const variables = {
    ...input,
    speciesLabel,
    entityName,
    entitySuffix: entityName ? ` (${entityName})` : '',
  };

  const buildItem = (dateValue, extraTitleVariables = {}) => ({
    date: dateValue,
    title: fillTemplate(event.titleTemplate, { ...variables, ...extraTitleVariables }).trim(),
    description: fillTemplate(event.description, { ...variables, ...extraTitleVariables }).trim(),
    category: event.category || 'general',
    tags: Array.isArray(event.tags) ? event.tags : [],
    priority: Number.isFinite(event.priority) ? event.priority : 5,
    reminderMinutes: Number.isFinite(event.reminderMinutes) ? event.reminderMinutes : null,
    calendarId: event.calendarId || 'health',
    status: event.status || 'confirmed',
  });

  const items = [];

  if (mode === 'single') {
    let eventDate = new Date(anchorDate);
    if (Number.isFinite(schedule.offsetDays)) eventDate = addDays(eventDate, schedule.offsetDays);
    if (Number.isFinite(schedule.offsetWeeks)) eventDate = addWeeks(eventDate, schedule.offsetWeeks);
    if (Number.isFinite(schedule.offsetMonths)) eventDate = addMonths(eventDate, schedule.offsetMonths);
    items.push(buildItem(eventDate));
  }

  if (mode === 'series') {
    const intervalDays = Number(schedule.intervalDays) || 0;
    const intervalWeeks = Number(schedule.intervalWeeks) || 0;
    const intervalMonths = Number(schedule.intervalMonths) || 0;
    const maxOccurrences = Number(schedule.maxOccurrences) || 200;

    let current = new Date(anchorDate);
    let count = 0;

    while (count < maxOccurrences && current <= windowEnd) {
      items.push(buildItem(current));
      count += 1;

      if (intervalDays) current = addDays(current, intervalDays);
      else if (intervalWeeks) current = addWeeks(current, intervalWeeks);
      else if (intervalMonths) current = addMonths(current, intervalMonths);
      else break;
    }
  }

  if (mode === 'rangeWeeks') {
    const startWeek = Number(schedule.startWeek) || 0;
    const endWeek = Number(schedule.endWeek) || startWeek;
    const stepWeeks = Math.max(1, Number(schedule.stepWeeks) || 1);

    for (let week = startWeek; week <= endWeek; week += stepWeeks) {
      const eventDate = addWeeks(anchorDate, week);
      items.push(buildItem(eventDate, { week }));
    }
  }

  return items.filter((item) => {
    const dateValue = parseDate(item.date);
    if (!dateValue) return false;
    if (dateValue < windowStart || dateValue > windowEnd) return false;
    if (templateData.calculationWindow?.futureOnly && dateValue <= new Date()) return false;
    return true;
  });
}

function normalizeField(field) {
  return {
    name: field.name,
    label: field.label,
    type: field.type || 'text',
    required: Boolean(field.required),
    placeholder: field.placeholder || '',
    defaultValue: field.defaultValue,
    min: field.min,
    max: field.max,
    options: Array.isArray(field.options) ? field.options : [],
  };
}

function mapTemplateToRuntime(templateData) {
  const runtimeTemplate = {
    id: templateData.id,
    title: templateData.title,
    description: templateData.description,
    disclaimer: templateData.disclaimer,
    fields: (templateData.fields || []).map(normalizeField),
    calculate: ({ input }) => {
      const derivedDates = resolveDerivedDates(templateData, input);
      const startAnchor = templateData.calculationWindow?.startAnchor;
      const endAnchor = templateData.calculationWindow?.endAnchor;

      const windowStart = resolveAnchorDate(startAnchor, input, derivedDates) || new Date('1970-01-01T00:00:00.000Z');
      const windowEnd = resolveAnchorDate(endAnchor, input, derivedDates) || addYears(windowStart, 5);

      const context = {
        input,
        derivedDates,
        templateData,
        windowStart,
        windowEnd,
      };

      const allItems = (templateData.events || []).flatMap((event) => createEventItems(event, context));

      const deduped = new Map();
      allItems.forEach((item) => {
        const key = `${item.title}::${new Date(item.date).toISOString()}`;
        deduped.set(key, item);
      });

      return [...deduped.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
    },
  };

  return runtimeTemplate;
}

function addYears(date, years) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

async function readTemplateJson(relativePath) {
  const resolvedUrl = new URL(relativePath, import.meta.url);

  if (resolvedUrl.protocol !== 'file:' && typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const response = await fetch(resolvedUrl);
    if (!response.ok) {
      throw new Error(`Failed to load ${relativePath}`);
    }
    return response.json();
  }

  const fs = await import('node:fs/promises');
  const text = await fs.readFile(resolvedUrl, 'utf8');
  return JSON.parse(text);
}

export async function loadCalculatorTemplates() {
  const sources = await Promise.all(TEMPLATE_FILES.map((file) => readTemplateJson(file)));
  return sources.map((entry) => mapTemplateToRuntime(entry));
}
