import { RECURRENCE } from '../../core/constants.js';
import {
  getDetectedTimeZone,
  getSupportedTimeZones,
  normalizeTimeZone,
  toDateTimeInputInTimeZone,
} from '../../core/dateUtils.js';

function toDateInputValue(value, timeZone) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : toDateTimeInputInTimeZone(parsed, timeZone);
}

export function renderAppointmentForm(root, onSubmit, options = {}) {
  const appointment = options.appointment || null;
  const calendarOptions = Array.isArray(options.calendarOptions) ? options.calendarOptions : [];
  const mode = options.mode === 'edit' ? 'edit' : 'create';
  const submitLabel = mode === 'edit' ? 'Save Appointment' : 'Add Appointment';

  const defaultTimezone = normalizeTimeZone(getDetectedTimeZone());
  const selectedTimezone = normalizeTimeZone(appointment?.timezone || defaultTimezone, defaultTimezone);
  const timezoneOptions = getSupportedTimeZones(defaultTimezone);
  const selectedCalendarId = appointment?.calendarId || 'default';

  root.innerHTML = `
    <form id="appointment-create-form" class="form-grid">
      <label for="f-date">Date & time</label>
      <input id="f-date" name="date" type="datetime-local" required value="${toDateInputValue(appointment?.date, selectedTimezone) || toDateTimeInputInTimeZone(new Date(), selectedTimezone)}" />
      
      <label for="f-endDate">End date & time</label>
      <input id="f-endDate" name="endDate" type="datetime-local" value="${toDateInputValue(appointment?.endDate, selectedTimezone)}" />
      
      <div class="form-row-check">
        <input id="f-allDay" name="allDay" type="checkbox" ${appointment?.allDay ? 'checked' : ''} />
        <label for="f-allDay">All day</label>
      </div>

      <label for="f-timezone">Timezone</label>
      <select id="f-timezone" name="timezone">
        ${timezoneOptions
          .map((timeZone) => `<option value="${timeZone}" ${timeZone === selectedTimezone ? 'selected' : ''}>${timeZone}</option>`)
          .join('')}
      </select>

      <label for="f-recurrence">Recurrence</label>
      <select id="f-recurrence" name="recurrence">
        <option value="${RECURRENCE.NONE}" ${appointment?.recurrence === RECURRENCE.NONE ? 'selected' : ''}>None</option>
        <option value="${RECURRENCE.DAILY}" ${appointment?.recurrence === RECURRENCE.DAILY ? 'selected' : ''}>Daily</option>
        <option value="${RECURRENCE.WEEKLY}" ${appointment?.recurrence === RECURRENCE.WEEKLY ? 'selected' : ''}>Weekly</option>
        <option value="${RECURRENCE.MONTHLY}" ${appointment?.recurrence === RECURRENCE.MONTHLY ? 'selected' : ''}>Monthly</option>
        <option value="${RECURRENCE.YEARLY}" ${appointment?.recurrence === RECURRENCE.YEARLY ? 'selected' : ''}>Yearly</option>
      </select>

      <label for="f-recurrenceCount">Recurrence limit (occurrences)</label>
      <input id="f-recurrenceCount" name="recurrenceCount" type="number" min="1" step="1" placeholder="Unlimited" value="${appointment?.recurrenceCount ?? ''}" />

      <label for="f-title">Title</label>
      <input id="f-title" name="title" maxlength="100" value="${appointment?.title || ''}" />

      <label for="f-description">Description</label>
      <textarea id="f-description" name="description" rows="3">${appointment?.description || ''}</textarea>

      <label for="f-location">Location</label>
      <input id="f-location" name="location" placeholder="clinic, office, online" value="${appointment?.location || ''}" />

      <label for="f-url">Event URL</label>
      <input id="f-url" name="url" type="url" placeholder="https://..." value="${appointment?.url || ''}" />

      <label for="f-status">Status</label>
      <select id="f-status" name="status">
        <option value="confirmed" ${appointment?.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
        <option value="tentative" ${appointment?.status === 'tentative' ? 'selected' : ''}>Tentative</option>
        <option value="cancelled" ${appointment?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>

      <label for="f-attendees">Attendees (comma-separated)</label>
      <input id="f-attendees" name="attendees" placeholder="email1, email2" value="${Array.isArray(appointment?.attendees) ? appointment.attendees.join(', ') : ''}" />

      <label for="f-contact">Contact (comma-separated)</label>
      <input id="f-contact" name="contact" placeholder="url, phone, email" value="${Array.isArray(appointment?.contact) ? appointment.contact.join(', ') : ''}" />

      <label for="f-category">Category</label>
      <input id="f-category" name="category" placeholder="work, health, family" value="${appointment?.category || ''}" />

      <label for="f-tags">Tags (comma-separated)</label>
      <input id="f-tags" name="tags" placeholder="vaccine, dog" value="${Array.isArray(appointment?.tags) ? appointment.tags.join(', ') : ''}" />

      <label for="f-calendarId">Calendar</label>
      <select id="f-calendarId" name="calendarId">
        ${calendarOptions
          .map(
            (calendar) =>
              `<option value="${calendar.id}" ${calendar.id === selectedCalendarId ? 'selected' : ''}>${calendar.name}</option>`,
          )
          .join('')}
      </select>

      <label for="f-reminderMinutes">Reminder (minutes before start)</label>
      <input id="f-reminderMinutes" name="reminderMinutes" type="number" min="0" step="1" value="${appointment?.reminderMinutes ?? ''}" />

      <label for="f-priority">Priority (1-10)</label>
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
    }
  });
}
