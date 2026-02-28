import { formatDateTime } from '../../core/dateUtils.js';
import { escapeHtml } from '../../core/sanitize.js';
import { buildProfessionalContactList, renderProfessionalDetailsHtml } from '../professional/professionalContacts.js';
import { t } from '../../i18n/index.js';

function listOrFallback(items) {
  return items && items.length ? items.map((item) => escapeHtml(item)).join(', ') : t('details.none');
}

export function renderAppointmentDetails(root, appointment, options = {}) {
  if (!appointment) {
    root.innerHTML = `<p class="small">${t('details.noAppointmentSelected')}</p>`;
    return;
  }

  const professionals = Array.isArray(options.professionals) ? options.professionals : [];
  const professional = appointment.professionalId
    ? professionals.find((p) => p.id === appointment.professionalId) || null
    : null;
  const effectiveContact = professional ? buildProfessionalContactList(professional) : appointment.contact;
  const effectiveLocation = professional?.address || appointment.location;
  const effectiveUrl = professional?.website || appointment.url;

  const occurrence = new Date(appointment.occurrenceDate || appointment.date);

  root.innerHTML = `
    <div class="details-grid">
      <div><strong>${t('details.title')}:</strong> ${escapeHtml(appointment.title || t('details.untitled'))}</div>
      <div><strong>${t('details.datetime')}:</strong> ${formatDateTime(occurrence, { timeZone: appointment.timezone, includeTimeZone: true })}</div>
      <div><strong>${t('details.recurrence')}:</strong> ${escapeHtml(appointment.recurrence || 'none')}</div>
      <div><strong>${t('details.priority')}:</strong> ${appointment.priority}</div>
      <div><strong>${t('details.allDay')}:</strong> ${appointment.allDay ? t('details.yes') : t('details.no')}</div>
      <div><strong>${t('details.timezone')}:</strong> ${escapeHtml(appointment.timezone || t('details.local'))}</div>
      <div><strong>${t('details.calendar')}:</strong> ${escapeHtml(appointment.calendarId || 'default')}</div>
      <div><strong>${t('details.reminder')}:</strong> ${appointment.reminderMinutes != null ? t('details.minBefore', { minutes: appointment.reminderMinutes }) : t('details.off')}</div>
      <div><strong>${t('details.endDatetime')}:</strong> ${appointment.endDate ? formatDateTime(new Date(appointment.endDate), { timeZone: appointment.timezone, includeTimeZone: true }) : t('details.notSet')}</div>
      <div><strong>${t('details.location')}:</strong> ${escapeHtml(effectiveLocation || t('details.notSet'))}</div>
      <div><strong>${t('details.eventUrl')}:</strong> ${escapeHtml(effectiveUrl || t('details.notSet'))}</div>
      <div><strong>${t('details.status')}:</strong> ${escapeHtml(appointment.status || 'confirmed')}</div>
      <div><strong>${t('details.attendees')}:</strong> ${listOrFallback(appointment.attendees)}</div>
      <div><strong>${t('details.category')}:</strong> ${escapeHtml(appointment.category || t('details.general'))}</div>
      <div><strong>${t('details.tags')}:</strong> ${listOrFallback(appointment.tags)}</div>
      <div><strong>${t('details.contact')}:</strong> ${listOrFallback(effectiveContact)}</div>
      <div><strong>${t('details.professional')}:</strong></div>
      ${renderProfessionalDetailsHtml(professional)}
      <div><strong>${t('details.description')}:</strong> ${escapeHtml(appointment.description || t('details.noDescription'))}</div>
      <div><strong>${t('details.sourceId')}:</strong> ${escapeHtml(appointment.sourceId || appointment.id)}</div>
    </div>
    <div class="details-actions">
      <button type="button" class="primary" data-action="edit-appointment">${t('details.edit')}</button>
      <button type="button" data-action="delete-appointment">${t('details.delete')}</button>
    </div>
  `;
}
