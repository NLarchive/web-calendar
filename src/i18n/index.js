import { EN_MESSAGES } from '../../languages/en.js';
import { ES_MESSAGES } from '../../languages/es.js';

const STORAGE_KEY = 'web-appointment-language';
const DEFAULT_LANGUAGE = 'en';

const dictionaries = {
  en: EN_MESSAGES,
  es: ES_MESSAGES,
};

let currentLanguage = DEFAULT_LANGUAGE;
const listeners = new Set();

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function getByPath(source, path) {
  if (!source || !path) return undefined;
  return path.split('.').reduce((acc, segment) => {
    if (!isObject(acc)) return undefined;
    return acc[segment];
  }, source);
}

function interpolate(template, vars = {}) {
  return String(template).replace(/\{([^}]+)\}/g, (_, rawKey) => {
    const key = rawKey.trim();
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}

export function normalizeLanguage(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es';
  return 'en';
}

export function getLanguage() {
  return currentLanguage;
}

export function getLocale() {
  return currentLanguage === 'es' ? 'es-ES' : 'en-US';
}

export function t(key, vars = {}, fallback = '') {
  const selected = getByPath(dictionaries[currentLanguage], key);
  const base = selected == null ? getByPath(dictionaries.en, key) : selected;
  if (base == null) return fallback || key;
  if (typeof base !== 'string') return base;
  return interpolate(base, vars);
}

export function setLanguage(nextLanguage, options = {}) {
  const normalized = normalizeLanguage(nextLanguage);
  currentLanguage = normalized;

  if (!options.skipPersist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // no-op
    }
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
  }

  listeners.forEach((listener) => {
    try {
      listener(normalized);
    } catch {
      // keep language switch resilient
    }
  });

  return normalized;
}

export function initializeLanguage() {
  let preferred = DEFAULT_LANGUAGE;

  try {
    preferred =
      window.localStorage.getItem(STORAGE_KEY) ||
      (typeof navigator !== 'undefined' ? navigator.language : DEFAULT_LANGUAGE) ||
      DEFAULT_LANGUAGE;
  } catch {
    // no-op
  }

  return setLanguage(preferred, { skipPersist: false });
}

export function onLanguageChange(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyContentTranslation(element, value) {
  if (value == null) return;
  element.textContent = String(value);
}

export function applyStaticTranslations(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') return;

  root.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (!key) return;
    applyContentTranslation(element, t(key));
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (!key) return;
    element.setAttribute('placeholder', t(key));
  });

  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const key = element.getAttribute('data-i18n-aria-label');
    if (!key) return;
    element.setAttribute('aria-label', t(key));
  });

  root.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const key = element.getAttribute('data-i18n-title');
    if (!key) return;
    element.setAttribute('title', t(key));
  });

  root.querySelectorAll('[data-i18n-value]').forEach((element) => {
    const key = element.getAttribute('data-i18n-value');
    if (!key) return;
    if ('value' in element) {
      element.value = t(key);
    }
  });
}
