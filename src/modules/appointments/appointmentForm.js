import { RECURRENCE } from '../../core/constants.js';
import {
  getDetectedTimeZone,
  getSupportedTimeZones,
  normalizeTimeZone,
  toDateTimeInputInTimeZone,
} from '../../core/dateUtils.js';
import { renderProfessionalOptions } from '../professional/professionalContacts.js';
import { t } from '../../i18n/index.js';

function toDateInputValue(value, timeZone) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : toDateTimeInputInTimeZone(parsed, timeZone);
}

export function renderAppointmentForm(root, onSubmit, options = {}) {
  const appointment = options.appointment || null;
  const calendarOptions = Array.isArray(options.calendarOptions) ? options.calendarOptions : [];
  const professionalOptions = Array.isArray(options.professionalOptions) ? options.professionalOptions : [];
  const mode = options.mode === 'edit' ? 'edit' : 'create';
  const submitLabel = mode === 'edit' ? t('form.saveAppointment') : t('form.addAppointment');

  const defaultTimezone = normalizeTimeZone(getDetectedTimeZone());
  const selectedTimezone = normalizeTimeZone(appointment?.timezone || defaultTimezone, defaultTimezone);
  const timezoneOptions = getSupportedTimeZones(defaultTimezone);
  const selectedCalendarId = appointment?.calendarId || 'default';

  root.innerHTML = `
    <form id="appointment-create-form" class="form-grid">
      <label for="f-date">${t('form.dateTime')}</label>
      <input id="f-date" name="date" type="datetime-local" required value="${toDateInputValue(appointment?.date, selectedTimezone) || toDateTimeInputInTimeZone(new Date(), selectedTimezone)}" />
      
      <label for="f-endDate">${t('form.endDateTime')}</label>
      <input id="f-endDate" name="endDate" type="datetime-local" value="${toDateInputValue(appointment?.endDate, selectedTimezone)}" />
      
      <div class="form-row-check">
        <input id="f-allDay" name="allDay" type="checkbox" ${appointment?.allDay ? 'checked' : ''} />
        <label for="f-allDay">${t('form.allDay')}</label>
      </div>

      <label for="f-timezone">${t('form.timezone')}</label>
      <select id="f-timezone" name="timezone">
        ${timezoneOptions
          .map((timeZone) => `<option value="${timeZone}" ${timeZone === selectedTimezone ? 'selected' : ''}>${timeZone}</option>`)
          .join('')}
      </select>

      <label for="f-recurrence">${t('form.recurrence')}</label>
      <select id="f-recurrence" name="recurrence">
        <option value="${RECURRENCE.NONE}" ${appointment?.recurrence === RECURRENCE.NONE ? 'selected' : ''}>${t('form.recurrenceNone')}</option>
        <option value="${RECURRENCE.DAILY}" ${appointment?.recurrence === RECURRENCE.DAILY ? 'selected' : ''}>${t('form.recurrenceDaily')}</option>
        <option value="${RECURRENCE.WEEKLY}" ${appointment?.recurrence === RECURRENCE.WEEKLY ? 'selected' : ''}>${t('form.recurrenceWeekly')}</option>
        <option value="${RECURRENCE.MONTHLY}" ${appointment?.recurrence === RECURRENCE.MONTHLY ? 'selected' : ''}>${t('form.recurrenceMonthly')}</option>
        <option value="${RECURRENCE.YEARLY}" ${appointment?.recurrence === RECURRENCE.YEARLY ? 'selected' : ''}>${t('form.recurrenceYearly')}</option>
      </select>

      <label for="f-recurrenceCount">${t('form.recurrenceLimit')}</label>
      <input id="f-recurrenceCount" name="recurrenceCount" type="number" min="1" step="1" placeholder="${t('form.unlimited')}" value="${appointment?.recurrenceCount ?? ''}" />

      <label for="f-title">${t('form.title')}</label>
      <input id="f-title" name="title" maxlength="100" value="${appointment?.title || ''}" />

      <label for="f-description">${t('form.description')}</label>
      <textarea id="f-description" name="description" rows="3">${appointment?.description || ''}</textarea>

      <label for="f-location">${t('form.location')}</label>
      <input id="f-location" name="location" placeholder="${t('form.locationPlaceholder')}" value="${appointment?.location || ''}" />

      <label for="f-url">${t('form.eventUrl')}</label>
      <input id="f-url" name="url" type="url" placeholder="https://..." value="${appointment?.url || ''}" />

      <label for="f-status">${t('form.status')}</label>
      <select id="f-status" name="status">
        <option value="confirmed" ${appointment?.status === 'confirmed' ? 'selected' : ''}>${t('navbar.confirmed')}</option>
        <option value="tentative" ${appointment?.status === 'tentative' ? 'selected' : ''}>${t('navbar.tentative')}</option>
        <option value="cancelled" ${appointment?.status === 'cancelled' ? 'selected' : ''}>${t('navbar.cancelled')}</option>
      </select>

      <label for="f-attendees">${t('form.attendees')}</label>
      <input id="f-attendees" name="attendees" placeholder="${t('form.attendeesPlaceholder')}" value="${Array.isArray(appointment?.attendees) ? appointment.attendees.join(', ') : ''}" />

      <label for="f-contact">${t('form.contact')}</label>
      <input id="f-contact" name="contact" placeholder="${t('form.contactPlaceholder')}" value="${Array.isArray(appointment?.contact) ? appointment.contact.join(', ') : ''}" />

      <label for="f-category">${t('form.category')}</label>
      <input id="f-category" name="category" placeholder="${t('form.categoryPlaceholder')}" value="${appointment?.category || ''}" />

      <label for="f-tags">${t('form.tags')}</label>
      <input id="f-tags" name="tags" placeholder="${t('form.tagsPlaceholder')}" value="${Array.isArray(appointment?.tags) ? appointment.tags.join(', ') : ''}" />

      <label for="f-calendarId">${t('form.calendar')}</label>
      <select id="f-calendarId" name="calendarId">
        ${calendarOptions
          .map(
            (calendar) =>
              `<option value="${calendar.id}" ${calendar.id === selectedCalendarId ? 'selected' : ''}>${calendar.name}</option>`,
          )
          .join('')}
      </select>

      <label for="f-professionalId">${t('form.professional')}</label>
      <select id="f-professionalId" name="professionalId">
        ${renderProfessionalOptions(professionalOptions, appointment?.professionalId)}
      </select>

      <label for="f-reminderMinutes">${t('form.reminderMinutes')}</label>
      <input id="f-reminderMinutes" name="reminderMinutes" type="number" min="0" step="1" value="${appointment?.reminderMinutes ?? ''}" />

      <label for="f-priority">${t('form.priority')}</label>
      <input id="f-priority" name="priority" type="number" min="1" max="10" value="${appointment?.priority ?? 5}" required />

      <button class="primary" type="submit">${submitLabel}</button>
    </form>
  `;

  const form = root.querySelector('#appointment-create-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (typeof onSubmit === 'function') {
      onSubmit(Object.fromEntries(data.entries()));
    }

    if (mode === 'create') {
      form.reset();
      form.elements.timezone.value = defaultTimezone;
      form.elements.date.value = toDateTimeInputInTimeZone(new Date(), form.elements.timezone.value);
      form.elements.endDate.value = '';
      form.elements.priority.value = '5';
      form.elements.recurrence.value = RECURRENCE.NONE;
      form.elements.status.value = 'confirmed';
      if (form.elements.professionalId) form.elements.professionalId.value = '';
    }
  });
}
