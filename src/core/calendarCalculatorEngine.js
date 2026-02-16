function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function addWeeks(baseDate, weeks) {
  return addDays(baseDate, weeks * 7);
}

function addMonths(baseDate, months) {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toIso(date) {
  return new Date(date).toISOString();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeFieldValue(field, rawValue) {
  if (field.type === 'number') {
    if (rawValue === '' || rawValue == null) return null;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (field.type === 'date') {
    return rawValue ? String(rawValue) : '';
  }

  if (field.type === 'select') {
    return rawValue ? String(rawValue) : field.defaultValue || '';
  }

  return rawValue == null ? '' : String(rawValue);
}

function validateInput(template, input) {
  const errors = [];

  template.fields.forEach((field) => {
    const value = input[field.name];
    const isEmpty = value === '' || value == null;

    if (field.required && isEmpty) {
      errors.push(`${field.label} is required.`);
      return;
    }

    if (field.type === 'number' && value != null && value !== '') {
      if (!Number.isFinite(value)) {
        errors.push(`${field.label} must be a valid number.`);
      }
      if (Number.isFinite(field.min) && value < field.min) {
        errors.push(`${field.label} must be at least ${field.min}.`);
      }
      if (Number.isFinite(field.max) && value > field.max) {
        errors.push(`${field.label} must be at most ${field.max}.`);
      }
    }

    if (field.type === 'date' && value) {
      const parsed = parseDate(value);
      if (!parsed) {
        errors.push(`${field.label} must be a valid date.`);
      }
    }
  });

  return errors;
}

export function createCalendarCalculatorEngine(templates = []) {
  const list = ensureArray(templates);
  const byId = new Map(list.map((template) => [template.id, template]));

  function getTemplate(templateId) {
    return byId.get(templateId) || null;
  }

  function getTemplates() {
    return list.map(({ id, title, description, disclaimer }) => ({
      id,
      title,
      description,
      disclaimer,
    }));
  }

  function getFields(templateId) {
    return getTemplate(templateId)?.fields || [];
  }

  function calculate(templateId, rawInput = {}) {
    const template = getTemplate(templateId);
    if (!template) {
      return { ok: false, errors: ['Calculator template not found.'], appointments: [] };
    }

    const input = {};
    template.fields.forEach((field) => {
      input[field.name] = normalizeFieldValue(field, rawInput[field.name]);
    });

    const errors = validateInput(template, input);
    if (errors.length) {
      return { ok: false, errors, appointments: [] };
    }

    const helper = {
      parseDate,
      addDays,
      addWeeks,
      addMonths,
      toIso,
      now: () => new Date(),
      afterNow: (date) => date && date.getTime() > Date.now(),
    };

    try {
      const appointments = ensureArray(template.calculate({ input, helper }))
        .filter((item) => item && item.date)
        .map((item) => ({
          ...item,
          date: toIso(item.date),
          endDate: item.endDate ? toIso(item.endDate) : null,
          recurrence: item.recurrence || 'none',
          status: item.status || 'confirmed',
          calendarId: item.calendarId || 'health',
          timezone: item.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          allDay: Boolean(item.allDay),
          tags: ensureArray(item.tags),
          attendees: ensureArray(item.attendees),
          contact: ensureArray(item.contact),
          priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : 5,
        }));

      return { ok: true, errors: [], appointments };
    } catch (error) {
      return {
        ok: false,
        errors: [error?.message || 'Unable to calculate schedule.'],
        appointments: [],
      };
    }
  }

  return {
    getTemplates,
    getTemplate,
    getFields,
    calculate,
  };
}
