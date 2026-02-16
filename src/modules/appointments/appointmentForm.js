import { RECURRENCE } from '../../core/constants.js';
import { toLocalDateTimeInput } from '../../core/dateUtils.js';

export function renderAppointmentForm(root, onSubmit) {
  root.innerHTML = `
    <form id="appointment-create-form" class="form-grid">
      <label>Date & time<input name="date" type="datetime-local" required value="${toLocalDateTimeInput(new Date())}" /></label>
      <label>End date & time<input name="endDate" type="datetime-local" /></label>
      <label>Recurrence
        <select name="recurrence">
          <option value="${RECURRENCE.NONE}">None</option>
          <option value="${RECURRENCE.DAILY}">Daily</option>
          <option value="${RECURRENCE.WEEKLY}">Weekly</option>
          <option value="${RECURRENCE.MONTHLY}">Monthly</option>
          <option value="${RECURRENCE.YEARLY}">Yearly</option>
        </select>
      </label>
      <label>Title<input name="title" required maxlength="100" /></label>
      <label>Description<textarea name="description" rows="3"></textarea></label>
      <label>Location<input name="location" placeholder="clinic, office, online" /></label>
      <label>Event URL<input name="url" type="url" placeholder="https://..." /></label>
      <label>Status
        <select name="status">
          <option value="confirmed">Confirmed</option>
          <option value="tentative">Tentative</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label>Attendees (comma-separated)<input name="attendees" placeholder="email1, email2" /></label>
      <label>Contact (comma-separated)<input name="contact" placeholder="url, phone, email" /></label>
      <label>Category<input name="category" placeholder="work, health, family" /></label>
      <label>Tags (comma-separated)<input name="tags" placeholder="vaccine, dog" /></label>
      <label>Priority (1-10)<input name="priority" type="number" min="1" max="10" value="5" required /></label>
      <button class="primary" type="submit">Add Appointment</button>
    </form>
  `;

  const form = root.querySelector('#appointment-create-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (typeof onSubmit === 'function') {
      onSubmit(Object.fromEntries(data.entries()));
    }
    form.reset();
    form.elements.date.value = toLocalDateTimeInput(new Date());
    form.elements.endDate.value = '';
    form.elements.priority.value = '5';
    form.elements.recurrence.value = RECURRENCE.NONE;
    form.elements.status.value = 'confirmed';
  });
}
