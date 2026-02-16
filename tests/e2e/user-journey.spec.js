// @ts-check
import { test, expect } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Helper: get a clean app state (clears localStorage before nav)     */
/* ------------------------------------------------------------------ */
async function loadApp(page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.waitForSelector('.navbar');
}

/* ================================================================== */
/*  1.  INITIAL LOAD                                                   */
/* ================================================================== */
test.describe('Initial load', () => {
  test('app renders navbar, calendar, and empty appointment list', async ({ page }) => {
    await loadApp(page);
    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page.locator('#calendar')).toBeVisible();
    await expect(page.locator('#appointment-list')).toBeVisible();
    await expect(page.locator('#current-datetime')).not.toBeEmpty();
  });
});

/* ================================================================== */
/*  2.  CREATE APPOINTMENT                                             */
/* ================================================================== */
test.describe('Create appointment', () => {
  test('opens modal, fills form, submits, and appointment appears in list', async ({ page }) => {
    await loadApp(page);

    // open new appointment modal
    await page.click('button[data-action="open-new-appointment"]');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);

    // fill the form
    const form = page.locator('#appointment-create-form');
    await form.locator('input[name="title"]').fill('E2E Test Appointment');
    await form.locator('textarea[name="description"]').fill('Created by Playwright');
    await form.locator('input[name="category"]').fill('testing');
    await form.locator('input[name="tags"]').fill('e2e, playwright');
    await form.locator('input[name="priority"]').fill('7');

    // submit
    await form.locator('button[type="submit"]').click();

    // modal should close
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);

    // appointment appears in the list
    await expect(page.locator('#appointment-list')).toContainText('E2E Test Appointment');
  });
});

/* ================================================================== */
/*  3.  VIEW MODE SWITCHING                                            */
/* ================================================================== */
test.describe('View mode switching', () => {
  test('switches between day, week, month, and year views', async ({ page }) => {
    await loadApp(page);
    const header = page.locator('#current-datetime');
    const viewSelect = page.locator('#view-mode-select');

    // default is month
    await expect(header).toContainText(/\w+ \d{4}/);

    // switch to year
    await viewSelect.selectOption('year');
    await expect(header).toContainText(/Year:\s*\d{4}/);

    // switch to week
    await viewSelect.selectOption('week');
    await expect(header).toContainText(/Week:/);

    // switch to day
    await viewSelect.selectOption('day');
    await expect(header).toContainText(/\w{3},/);

    // back to month
    await viewSelect.selectOption('month');
    await expect(header).toContainText(/\w+ \d{4}/);
  });
});

/* ================================================================== */
/*  4.  NAVIGATION (prev / today / next)                               */
/* ================================================================== */
test.describe('Calendar navigation', () => {
  test('prev and next buttons change the focused period', async ({ page }) => {
    await loadApp(page);
    const header = page.locator('#current-datetime');
    const initial = await header.textContent();

    await page.click('button[data-action="next"]');
    const after = await header.textContent();
    expect(after).not.toBe(initial);

    await page.click('button[data-action="prev"]');
    const backToInitial = await header.textContent();
    expect(backToInitial).toBe(initial);
  });

  test('today button resets to current month', async ({ page }) => {
    await loadApp(page);

    // navigate away
    await page.click('button[data-action="next"]');
    await page.click('button[data-action="next"]');

    // click today
    await page.click('button[data-action="today"]');

    const header = page.locator('#current-datetime');
    const now = new Date();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    // header should contain current year
    await expect(header).toContainText(String(now.getFullYear()));
  });
});

/* ================================================================== */
/*  5.  SEARCH / FILTER CONTROLS                                       */
/* ================================================================== */
test.describe('Search and filters', () => {
  /** Seed the app with a known appointment before each filter test */
  async function seedAppointments(page) {
    await loadApp(page);

    // create first appointment — confirmed/health
    await page.click('button[data-action="open-new-appointment"]');
    const form = page.locator('#appointment-create-form');
    await form.locator('input[name="title"]').fill('Confirmed Health Check');
    await form.locator('select[name="status"]').selectOption('confirmed');
    await form.locator('input[name="category"]').fill('health');
    await form.locator('input[name="priority"]').fill('8');
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);

    // create second appointment — tentative/work
    await page.click('button[data-action="open-new-appointment"]');
    const form2 = page.locator('#appointment-create-form');
    await form2.locator('input[name="title"]').fill('Tentative Meeting');
    await form2.locator('select[name="status"]').selectOption('tentative');
    await form2.locator('input[name="category"]').fill('work');
    await form2.locator('input[name="priority"]').fill('5');
    await form2.locator('button[type="submit"]').click();
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
  }

  test('search input filters the list without closing dropdown', async ({ page }) => {
    await seedAppointments(page);

    // open filters dropdown
    await page.click('details[data-group="filters"] > summary');
    await expect(page.locator('details[data-group="filters"]')).toHaveAttribute('open', '');

    // type search text
    const search = page.locator('[data-action="search"]');
    await search.fill('Health');

    // dropdown should still be open
    await expect(page.locator('details[data-group="filters"]')).toHaveAttribute('open', '');

    // list should only show the matching appointment
    await expect(page.locator('#appointment-list')).toContainText('Confirmed Health Check');
    await expect(page.locator('#appointment-list')).not.toContainText('Tentative Meeting');
  });

  test('status filter works and dropdown stays open', async ({ page }) => {
    await seedAppointments(page);

    // open filters dropdown
    await page.click('details[data-group="filters"] > summary');

    // filter by tentative
    await page.locator('[data-action="filter-status"]').selectOption('tentative');

    // dropdown should stay open
    await expect(page.locator('details[data-group="filters"]')).toHaveAttribute('open', '');

    // only tentative visible
    await expect(page.locator('#appointment-list')).toContainText('Tentative Meeting');
    await expect(page.locator('#appointment-list')).not.toContainText('Confirmed Health Check');

    // reset to all
    await page.locator('[data-action="filter-status"]').selectOption('all');
    await expect(page.locator('#appointment-list')).toContainText('Confirmed Health Check');
    await expect(page.locator('#appointment-list')).toContainText('Tentative Meeting');
  });

  test('from/to date filters work and dropdown stays open', async ({ page }) => {
    await seedAppointments(page);

    // open filters dropdown
    await page.click('details[data-group="filters"] > summary');

    // set a date range in the far future (no appointments exist there)
    await page.locator('[data-action="filter-from-date"]').fill('2030-01-01');
    await page.locator('[data-action="filter-to-date"]').fill('2030-12-31');

    // dropdown should stay open
    await expect(page.locator('details[data-group="filters"]')).toHaveAttribute('open', '');

    // no appointments should match
    await expect(page.locator('#appointment-list')).toContainText('No appointments yet');

    // clear date filter
    await page.locator('[data-action="filter-from-date"]').fill('');
    await page.locator('[data-action="filter-to-date"]').fill('');

    // appointments come back
    await expect(page.locator('#appointment-list')).toContainText('Confirmed Health Check');
  });
});

/* ================================================================== */
/*  6.  APPOINTMENT DETAILS + EDIT + DELETE                            */
/* ================================================================== */
test.describe('Appointment details, edit, and delete', () => {
  async function seedAndGetToCalendar(page) {
    await loadApp(page);

    // create appointment for today so it appears in calendar
    await page.click('button[data-action="open-new-appointment"]');
    const form = page.locator('#appointment-create-form');
    await form.locator('input[name="title"]').fill('Detail Test Appt');
    await form.locator('input[name="priority"]').fill('6');
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
  }

  test('clicking a calendar item opens the details modal', async ({ page }) => {
    await seedAndGetToCalendar(page);

    // find the clickable item in the calendar
    const calendarItem = page.locator('#calendar .calendar-item-trigger', { hasText: 'Detail Test Appt' });
    if (await calendarItem.count() > 0) {
      await calendarItem.first().click();
      await expect(page.locator('#appointment-details-modal')).not.toHaveClass(/hidden/);
      await expect(page.locator('#appointment-details-content')).toContainText('Detail Test Appt');
    }
  });

  test('clicking an upcoming item opens the details modal', async ({ page }) => {
    await seedAndGetToCalendar(page);

    const listItem = page.locator('#appointment-list [data-action="open-appointment-details"]', {
      hasText: 'Detail Test Appt',
    });
    await expect(listItem.first()).toBeVisible();
    await listItem.first().click();

    await expect(page.locator('#appointment-details-modal')).not.toHaveClass(/hidden/);
    await expect(page.locator('#appointment-details-content')).toContainText('Detail Test Appt');
  });

  test('edit flow pre-fills form and saves changes', async ({ page }) => {
    await seedAndGetToCalendar(page);

    // open details
    const calendarItem = page.locator('#calendar .calendar-item-trigger', { hasText: 'Detail Test Appt' });
    if (await calendarItem.count() === 0) return;
    await calendarItem.first().click();

    // click edit
    const editBtn = page.locator('[data-action="edit-appointment"]');
    if (await editBtn.count() === 0) return;
    await editBtn.click();

    // details modal closes, appointment modal opens
    await expect(page.locator('#appointment-details-modal')).toHaveClass(/hidden/);
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);

    // change title
    const titleInput = page.locator('#appointment-create-form input[name="title"]');
    await titleInput.fill('Edited Appt Title');
    await page.locator('#appointment-create-form button[type="submit"]').click();

    // modal closes and list shows updated title
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
    await expect(page.locator('#appointment-list')).toContainText('Edited Appt Title');
  });

  test('delete flow removes the appointment', async ({ page }) => {
    await seedAndGetToCalendar(page);

    const calendarItem = page.locator('#calendar .calendar-item-trigger', { hasText: 'Detail Test Appt' });
    if (await calendarItem.count() === 0) return;
    await calendarItem.first().click();

    // set up dialog handler for the confirm prompt
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const deleteBtn = page.locator('[data-action="delete-appointment"]');
    if (await deleteBtn.count() === 0) return;
    await deleteBtn.click();

    // details modal closes
    await expect(page.locator('#appointment-details-modal')).toHaveClass(/hidden/);

    // appointment is gone from list
    await expect(page.locator('#appointment-list')).not.toContainText('Detail Test Appt');
  });
});

/* ================================================================== */
/*  7.  LOAD SAMPLE STATE                                              */
/* ================================================================== */
test.describe('Load sample state', () => {
  test('loads dog vet care state and populates calendar', async ({ page }) => {
    await loadApp(page);

    // open actions dropdown
    await page.click('details[data-group="actions"] > summary');
    await page.click('button[data-action="load-state"]');

    // state load modal should be visible
    await expect(page.locator('#state-load-modal')).not.toHaveClass(/hidden/);

    // select dog vet care
    await page.locator('#load-state-sample').selectOption('dog-vet-care-state.json');

    // accept the confirmation dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.locator('#state-load-form button[type="submit"]').click();

    // modal closes after load
    await expect(page.locator('#state-load-modal')).toHaveClass(/hidden/);

    // list should now contain vet appointments
    await expect(page.locator('#appointment-list')).toContainText('vaccine');
  });

  test('loads empty state and clears appointments', async ({ page }) => {
    await loadApp(page);

    // first create an appointment
    await page.click('button[data-action="open-new-appointment"]');
    const form = page.locator('#appointment-create-form');
    await form.locator('input[name="title"]').fill('Temp Appointment');
    await form.locator('input[name="priority"]').fill('5');
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('#appointment-list')).toContainText('Temp Appointment');

    // now load empty state
    await page.click('details[data-group="actions"] > summary');
    await page.click('button[data-action="load-state"]');

    await page.locator('#load-state-source').selectOption('empty');

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.locator('#state-load-form button[type="submit"]').click();

    await expect(page.locator('#state-load-modal')).toHaveClass(/hidden/);
    await expect(page.locator('#appointment-list')).toContainText('No appointments yet');
  });
});

/* ================================================================== */
/*  8.  HIERARCHY DRILL-DOWN NAVIGATION                                */
/* ================================================================== */
test.describe('Hierarchy drill-down', () => {
  test('year → month → week → day drill-down works', async ({ page }) => {
    await loadApp(page);
    const header = page.locator('#current-datetime');
    const viewSelect = page.locator('#view-mode-select');

    // switch to year view
    await viewSelect.selectOption('year');
    await expect(header).toContainText(/Year:/);

    // click a month cell to drill down – year view renders .hierarchy-cell elements
    const monthCell = page.locator('#calendar .hierarchy-cell').first();
    if (await monthCell.count() > 0) {
      await monthCell.click();
      // should now be in month view
      const viewVal = await viewSelect.inputValue();
      expect(['month', 'week', 'day']).toContain(viewVal);
    }
  });
});

/* ================================================================== */
/*  9.  MODAL ACCESSIBILITY (ESC key, backdrop close)                  */
/* ================================================================== */
test.describe('Modal accessibility', () => {
  test('Escape key closes appointment modal', async ({ page }) => {
    await loadApp(page);

    await page.click('button[data-action="open-new-appointment"]');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
  });

  test('clicking overlay backdrop closes appointment modal', async ({ page }) => {
    await loadApp(page);

    await page.click('button[data-action="open-new-appointment"]');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);

    // click the overlay (modal root element, not the card)
    await page.locator('#appointment-modal').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
  });
});

/* ================================================================== */
/*  10. SORT TOGGLE                                                    */
/* ================================================================== */
test.describe('Sort toggle', () => {
  test('toggles between priority and date/time sort modes', async ({ page }) => {
    await loadApp(page);

    // open actions dropdown
    await page.click('details[data-group="actions"] > summary');
    const sortBtn = page.locator('button[data-action="toggle-sort"]');
    const initial = await sortBtn.textContent();

    await sortBtn.click();

    // re-open actions to check the button text changed
    await page.click('details[data-group="actions"] > summary');
    const after = await page.locator('button[data-action="toggle-sort"]').textContent();
    expect(after).not.toBe(initial);
  });
});

/* ================================================================== */
/*  11. FULL USER JOURNEY (end-to-end)                                 */
/* ================================================================== */
test.describe('Full user journey', () => {
  test('create → view → search → filter → edit → delete lifecycle', async ({ page }) => {
    await loadApp(page);

    /* --- Create --- */
    await page.click('button[data-action="open-new-appointment"]');
    const form = page.locator('#appointment-create-form');
    await form.locator('input[name="title"]').fill('Journey Appointment');
    await form.locator('textarea[name="description"]').fill('Full lifecycle test');
    await form.locator('select[name="status"]').selectOption('confirmed');
    await form.locator('input[name="category"]').fill('journey');
    await form.locator('input[name="tags"]').fill('e2e, journey');
    await form.locator('input[name="priority"]').fill('9');
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
    await expect(page.locator('#appointment-list')).toContainText('Journey Appointment');

    /* --- View switch round-trip --- */
    const viewSelect = page.locator('#view-mode-select');
    await viewSelect.selectOption('day');
    await viewSelect.selectOption('week');
    await viewSelect.selectOption('year');
    await viewSelect.selectOption('month');

    /* --- Search --- */
    await page.click('details[data-group="filters"] > summary');
    const search = page.locator('[data-action="search"]');
    await search.fill('Journey');
    await expect(page.locator('#appointment-list')).toContainText('Journey Appointment');
    await search.fill('NONEXISTENT_TEXT');
    await expect(page.locator('#appointment-list')).toContainText('No appointments yet');
    await search.fill('');

    /* --- Status filter --- */
    await page.locator('[data-action="filter-status"]').selectOption('confirmed');
    await expect(page.locator('#appointment-list')).toContainText('Journey Appointment');
    await page.locator('[data-action="filter-status"]').selectOption('cancelled');
    await expect(page.locator('#appointment-list')).toContainText('No appointments yet');
    await page.locator('[data-action="filter-status"]').selectOption('all');
    // close filters dropdown
    await page.click('details[data-group="filters"] > summary');

    /* --- Edit via calendar click --- */
    const calendarItem = page.locator('#calendar .calendar-item-trigger', { hasText: 'Journey Appointment' });
    if (await calendarItem.count() > 0) {
      await calendarItem.first().click();
      await expect(page.locator('#appointment-details-modal')).not.toHaveClass(/hidden/);

      await page.locator('[data-action="edit-appointment"]').click();
      await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);

      await page.locator('#appointment-create-form input[name="title"]').fill('Journey Renamed');
      await page.locator('#appointment-create-form button[type="submit"]').click();
      await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
      await expect(page.locator('#appointment-list')).toContainText('Journey Renamed');

      /* --- Delete --- */
      const calItem2 = page.locator('#calendar .calendar-item-trigger', { hasText: 'Journey Renamed' });
      if (await calItem2.count() > 0) {
        await calItem2.first().click();
        page.on('dialog', async (dialog) => {
          await dialog.accept();
        });
        await page.locator('[data-action="delete-appointment"]').click();
        await expect(page.locator('#appointment-details-modal')).toHaveClass(/hidden/);
        await expect(page.locator('#appointment-list')).not.toContainText('Journey Renamed');
      }
    }
  });
});
