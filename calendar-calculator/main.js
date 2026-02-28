import { DEFAULT_CALENDARS, SORT_MODES, VIEW_MODES } from '../src/core/constants.js';
import { createCalendarCalculatorEngine } from '../src/core/calendarCalculatorEngine.js';
import { formatDateTime } from '../src/core/dateUtils.js';
import { queueCalendarCalculatorImport } from '../src/plugins/calendarCalculatorPlugin.js';
import { loadCalculatorTemplates } from '../src/modules/calculator/calculatorTemplates.js';
import { applyStaticTranslations, initializeLanguage, setLanguage, t } from '../src/i18n/index.js';
import { renderNavbar } from '../src/modules/ui/navbar.js';

const navbarRoot = document.getElementById('calculator-navbar');
const templateSelect = document.getElementById('calculator-template');
const formRoot = document.getElementById('calculator-form');
const templateDescription = document.getElementById('template-description');
const templateDisclaimer = document.getElementById('template-disclaimer');
const statusRoot = document.getElementById('status');
const resultsRoot = document.getElementById('results');
const calculateButton = document.getElementById('calculate-button');
const importButton = document.getElementById('import-button');

let latestAppointments = [];
let engine = null;

initializeLanguage();
if (typeof document !== 'undefined') {
  document.title = t('calculator.title');
}

function renderCalcNavbar() {
  if (!navbarRoot) return;
  renderNavbar(
    navbarRoot,
    {
      viewMode: 'month',
      sortMode: SORT_MODES.PRIORITY,
      calendars: [],
      filters: { query: '', status: 'all', calendarId: 'all', fromDate: '', toDate: '' },
    },
    {
      onPrev: () => {},
      onToday: () => {},
      onNext: () => {},
      onViewChange: () => {},
      onToggleSort: () => {},
      onOpenNewAppointment: () => { window.location.href = '../index.html'; },
      onOpenCalculator: () => { window.location.href = '../index.html'; },
      onOpenSyncApp: () => {},
      onSaveState: () => {},
      onOpenLoadState: () => {},
      onToggleInfo: () => {},
      onSearchChange: () => {},
      onFilterStatusChange: () => {},
      onFilterCalendarChange: () => {},
      onFilterFromDateChange: () => {},
      onFilterToDateChange: () => {},
      onLanguageChange: (lang) => {
        setLanguage(lang);
        applyStaticTranslations(document);
        if (typeof document !== 'undefined') {
          document.title = t('calculator.title');
        }
        renderCalcNavbar();
        initializeCalculator();
      },
    },
  );
}

function setStatus(message, isError = false) {
  statusRoot.textContent = message;
  statusRoot.style.color = isError ? '#b91c1c' : '#0f766e';
}

function renderTemplateOptions() {
  if (!engine) return;
  templateSelect.innerHTML = engine
    .getTemplates()
    .map((template) => `<option value="${template.id}">${template.title}</option>`)
    .join('');
}

function renderFields(templateId) {
  if (!engine) return;
  const fields = engine.getFields(templateId);

  formRoot.innerHTML = fields
    .map((field) => {
      const optionHtml = (field.options || [])
        .map((option) => `<option value="${option.value}">${option.label}</option>`)
        .join('');

      const inputHtml =
        field.type === 'select'
          ? `<select name="${field.name}" ${field.required ? 'required' : ''}>${optionHtml}</select>`
          : `<input
              name="${field.name}"
              type="${field.type || 'text'}"
              ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
              ${Number.isFinite(field.min) ? `min="${field.min}"` : ''}
              ${Number.isFinite(field.max) ? `max="${field.max}"` : ''}
              ${field.required ? 'required' : ''}
            />`;

      return `<div class="field"><label for="f-${field.name}">${field.label}</label>${inputHtml}</div>`;
    })
    .join('');

  fields.forEach((field) => {
    const input = formRoot.querySelector(`[name="${field.name}"]`);
    if (!input) return;
    input.id = `f-${field.name}`;
    if (field.defaultValue != null) {
      input.value = String(field.defaultValue);
    }
  });

  const template = engine.getTemplate(templateId);
  templateDescription.textContent = template?.description || '';
  templateDisclaimer.textContent = template?.disclaimer || '';
}

function collectInput() {
  const data = new FormData(formRoot);
  return Object.fromEntries(data.entries());
}

function renderResults(appointments) {
  if (!appointments.length) {
    resultsRoot.innerHTML = `<p class="muted">${t('calculator.noFutureReminders')}</p>`;
    return;
  }

  const sorted = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));

  resultsRoot.innerHTML = sorted
    .map((item) => {
      const when = formatDateTime(new Date(item.date), { timeZone: item.timezone, includeTimeZone: true });
      return `
        <article class="result-item">
          <h3>${item.title}</h3>
          <div class="small">${when}</div>
          <div class="small">${item.category || t('calculator.defaultCategory')} • P${item.priority}</div>
          <p>${item.description || ''}</p>
        </article>
      `;
    })
    .join('');
}

function runCalculation() {
  if (!engine) {
    setStatus(t('calculator.templatesLoading'), true);
    return;
  }

  const templateId = templateSelect.value;
  const input = collectInput();
  const result = engine.calculate(templateId, input);

  if (!result.ok) {
    latestAppointments = [];
    importButton.disabled = true;
    renderResults([]);
    setStatus(result.errors.join(' '), true);
    return;
  }

  latestAppointments = result.appointments;
  importButton.disabled = latestAppointments.length === 0;
  renderResults(latestAppointments);
  setStatus(t('calculator.calculatedCount', { count: latestAppointments.length }));
}

function queueImport() {
  if (!latestAppointments.length) {
    setStatus(t('calculator.calculateFirst'), true);
    return;
  }

  const payload = {
    appointments: latestAppointments,
    calendars: DEFAULT_CALENDARS,
    source: 'calendar-calculator',
    createdAt: new Date().toISOString(),
  };

  const ok = queueCalendarCalculatorImport(payload);
  if (!ok) {
    setStatus(t('calculator.unableQueueImport'), true);
    return;
  }

  setStatus(t('calculator.importQueued'));
}

async function initializeCalculator() {
  try {
    const templates = await loadCalculatorTemplates();
    engine = createCalendarCalculatorEngine(templates);
    renderTemplateOptions();
    renderFields(templateSelect.value || engine.getTemplates()[0]?.id);
    setStatus(t('calculator.templatesLoaded'));
  } catch (error) {
    setStatus(error?.message || t('calculator.failedLoadTemplates'), true);
    calculateButton.disabled = true;
    importButton.disabled = true;
  }
}

templateSelect.addEventListener('change', () => {  latestAppointments = [];
  importButton.disabled = true;
  resultsRoot.innerHTML = `<p class="muted">${t('calculator.noRemindersYet')}</p>`;
  setStatus('');
  renderFields(templateSelect.value);
});

calculateButton.addEventListener('click', runCalculation);
importButton.addEventListener('click', queueImport);

renderCalcNavbar();
initializeCalculator();
applyStaticTranslations(document);
