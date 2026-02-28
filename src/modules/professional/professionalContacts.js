import { escapeHtml } from '../../core/sanitize.js';
import { t } from '../../i18n/index.js';

/**
 * Normalize a professional contact entry, ensuring all fields are present.
 */
export function normalizeProfessional(input) {
  return {
    id: input.id || crypto.randomUUID(),
    companyName: (input.companyName || '').trim(),
    contactPerson: (input.contactPerson || '').trim(),
    phone: (input.phone || '').trim(),
    whatsapp: (input.whatsapp || '').trim(),
    email: (input.email || '').trim(),
    website: (input.website || '').trim(),
    service: (input.service || '').trim(),
    address: (input.address || '').trim(),
    notes: (input.notes || '').trim(),
  };
}

/**
 * Find a professional by ID from the professionals array.
 */
export function findProfessionalById(professionals, id) {
  if (!id || !Array.isArray(professionals)) return null;
  return professionals.find((p) => p.id === id) || null;
}

/**
 * Build a display name for a professional (company or contact person).
 */
export function getProfessionalDisplayName(professional) {
  if (!professional) return '';
  return professional.companyName || professional.contactPerson || t('professional.unknownProfessional');
}

/**
 * Render clickable professional contact details as HTML.
 * Links (website, WhatsApp, email, phone) are rendered as clickable elements.
 */
export function renderProfessionalDetailsHtml(professional) {
  if (!professional) return `<span class="small">${t('professional.noneAssigned')}</span>`;

  const lines = [];

  if (professional.companyName) {
    lines.push(`<div><strong>${t('professional.company')}:</strong> ${escapeHtml(professional.companyName)}</div>`);
  }

  if (professional.contactPerson) {
    lines.push(`<div><strong>${t('professional.contactPerson')}:</strong> ${escapeHtml(professional.contactPerson)}</div>`);
  }

  if (professional.service) {
    lines.push(`<div><strong>${t('professional.service')}:</strong> ${escapeHtml(professional.service)}</div>`);
  }

  if (professional.phone) {
    const safePhone = escapeHtml(professional.phone);
    lines.push(`<div><strong>${t('professional.phone')}:</strong> <a href="tel:${safePhone}">${safePhone}</a></div>`);
  }

  if (professional.whatsapp) {
    const safeWhatsapp = escapeHtml(professional.whatsapp);
    lines.push(`<div><strong>${t('professional.whatsapp')}:</strong> <a href="${safeWhatsapp}" target="_blank" rel="noopener noreferrer">${t('professional.sendMessage')}</a></div>`);
  }

  if (professional.email) {
    const safeEmail = escapeHtml(professional.email);
    lines.push(`<div><strong>${t('professional.email')}:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></div>`);
  }

  if (professional.website) {
    const safeWebsite = escapeHtml(professional.website);
    lines.push(`<div><strong>${t('professional.website')}:</strong> <a href="${safeWebsite}" target="_blank" rel="noopener noreferrer">${safeWebsite}</a></div>`);
  }

  if (professional.address) {
    lines.push(`<div><strong>${t('professional.address')}:</strong> ${escapeHtml(professional.address)}</div>`);
  }

  if (professional.notes) {
    lines.push(`<div><strong>${t('professional.notes')}:</strong> ${escapeHtml(professional.notes)}</div>`);
  }

  return `<div class="professional-details">${lines.join('')}</div>`;
}

/**
 * Build a plain-text block of professional contact info for calendar event descriptions.
 */
export function buildProfessionalDescriptionText(professional) {
  if (!professional) return '';

  const parts = [];
  parts.push(t('professional.sectionTitle'));

  if (professional.companyName) parts.push(`${t('professional.company')}: ${professional.companyName}`);
  if (professional.contactPerson) parts.push(`${t('professional.contact')}: ${professional.contactPerson}`);
  if (professional.service) parts.push(`${t('professional.service')}: ${professional.service}`);
  if (professional.phone) parts.push(`${t('professional.phone')}: ${professional.phone}`);
  if (professional.whatsapp) parts.push(`${t('professional.whatsapp')}: ${professional.whatsapp}`);
  if (professional.email) parts.push(`${t('professional.email')}: ${professional.email}`);
  if (professional.website) parts.push(`${t('professional.website')}: ${professional.website}`);
  if (professional.address) parts.push(`${t('professional.address')}: ${professional.address}`);
  if (professional.notes) parts.push(`${t('professional.notes')}: ${professional.notes}`);

  return parts.join('\n');
}

/**
 * Render a <select> options HTML string for a professionals list.
 */
export function renderProfessionalOptions(professionals, selectedId) {
  const safeProfessionals = Array.isArray(professionals) ? professionals : [];
  const options = [`<option value=""${!selectedId ? ' selected' : ''}>${t('professional.none')}</option>`];

  safeProfessionals.forEach((p) => {
    const name = escapeHtml(getProfessionalDisplayName(p));
    const selected = p.id === selectedId ? ' selected' : '';
    options.push(`<option value="${escapeHtml(p.id)}"${selected}>${name}</option>`);
  });

  return options.join('');
}

/**
 * Build actionable contact list from professional profile.
 */
export function buildProfessionalContactList(professional) {
  if (!professional) return [];

  const items = [
    professional.website,
    professional.phone,
    professional.email,
    professional.whatsapp,
  ]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);

  return [...new Set(items)];
}
