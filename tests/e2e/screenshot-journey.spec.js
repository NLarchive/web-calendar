// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/*
 * Screenshot Wireframe Journey
 *
 * A comprehensive user journey that visits every feature of the
 * application and takes numbered screenshots at both desktop (1280x800)
 * and phone (390x844) viewports.
 *
 * The result is both an E2E regression test AND a visual wireframe
 * catalogue organized by device type.
 *
 * Screenshots are saved to:
 *   - tests/e2e/screenshots/desktop/  (1280x800 — desktop/tablet)
 *   - tests/e2e/screenshots/phone/    (390x844 — mobile)
 */

const SCREENSHOT_BASE_DIR = path.join('tests', 'e2e', 'screenshots');
const DESKTOP_DIR = path.join(SCREENSHOT_BASE_DIR, 'desktop');
const PHONE_DIR = path.join(SCREENSHOT_BASE_DIR, 'phone');

/**
 * Save a numbered screenshot with a descriptive slug
 * @param {import('@playwright/test').Page} page
 * @param {number} step
 * @param {string} slug
 * @param {string} subfolder
 */
async function snap(page, step, slug, subfolder) {
  const name = `${String(step).padStart(2, '0')}-${slug}.png`;
  await page.screenshot({ path: path.join(subfolder, name), fullPage: true });
}

/**
 * Load the app with a clean localStorage
 * @param {import('@playwright/test').Page} page
 */
async function loadApp(page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.waitForSelector('.navbar');
}

/**
 * Perform the complete screenshot journey at the given viewport and save to subfolder
 * @param {import('@playwright/test').Page} page
 * @param {string} subfolder
 */
async function screenshotJourney(page, subfolder) {
  let step = 0;

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 1 — Initial empty state                                 */
  /* ────────────────────────────────────────────────────────────── */
  await loadApp(page);
  await expect(page.locator('.navbar')).toBeVisible();
  await expect(page.locator('#calendar')).toBeVisible();
  await expect(page.locator('#appointment-list')).toBeVisible();
  await expect(page.locator('#current-datetime')).not.toBeEmpty();
  await snap(page, ++step, 'initial-empty-state', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 2 — Navbar clock visible                                */
  /* ────────────────────────────────────────────────────────────── */
  const clock = page.locator('.navbar-clock');
  await expect(clock).toBeVisible();
  await expect(clock).not.toBeEmpty();
  await snap(page, ++step, 'navbar-clock', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 3 — Open Actions dropdown                               */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="actions"] > summary');
  await expect(page.locator('details[data-group="actions"]')).toHaveAttribute('open', '');
  await snap(page, ++step, 'actions-dropdown-open', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 4 — Timezone selector inside Actions                    */
  /* ────────────────────────────────────────────────────────────── */
  const tzSelect = page.locator('#navbar-timezone-select');
  await expect(tzSelect).toBeVisible();
  await snap(page, ++step, 'timezone-in-actions', subfolder);
  // close actions
  await page.click('details[data-group="actions"] > summary');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 5 — Open Filters dropdown                               */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="filters"] > summary');
  await expect(page.locator('details[data-group="filters"]')).toHaveAttribute('open', '');
  await snap(page, ++step, 'filters-dropdown-open', subfolder);
  // close filters
  await page.click('details[data-group="filters"] > summary');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 6 — Open New Appointment modal                          */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('button[data-action="open-new-appointment"]');
  await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);
  await snap(page, ++step, 'new-appointment-modal-empty', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 7 — Fill appointment form                               */
  /* ────────────────────────────────────────────────────────────── */
  const form = page.locator('#appointment-create-form');
  await form.locator('input[name="title"]').fill('Wellness Check');
  await form.locator('textarea[name="description"]').fill('Annual dog wellness examination');
  await form.locator('select[name="status"]').selectOption('confirmed');
  await form.locator('input[name="category"]').fill('veterinary');
  await form.locator('input[name="tags"]').fill('health, dog, annual');
  await form.locator('input[name="priority"]').fill('8');
  await snap(page, ++step, 'new-appointment-form-filled', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 8 — Submit and verify in list                           */
  /* ────────────────────────────────────────────────────────────── */
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
  await expect(page.locator('#appointment-list')).toContainText('Wellness Check');
  await snap(page, ++step, 'appointment-created-in-list', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 9 — Create second appointment for filter testing        */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('button[data-action="open-new-appointment"]');
  const form2 = page.locator('#appointment-create-form');
  await form2.locator('input[name="title"]').fill('Team Standup');
  await form2.locator('textarea[name="description"]').fill('Daily sync meeting');
  await form2.locator('select[name="status"]').selectOption('tentative');
  await form2.locator('input[name="category"]').fill('work');
  await form2.locator('input[name="tags"]').fill('meeting, daily');
  await form2.locator('input[name="priority"]').fill('5');
  await form2.locator('button[type="submit"]').click();
  await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
  await expect(page.locator('#appointment-list')).toContainText('Team Standup');
  await snap(page, ++step, 'two-appointments-in-list', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 10 — Month view (default)                               */
  /* ────────────────────────────────────────────────────────────── */
  const header = page.locator('#current-datetime');
  const viewSelect = page.locator('#view-mode-select');
  await expect(header).toContainText(/\w+ \d{4}/);
  await snap(page, ++step, 'month-view', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 11 — Day view                                           */
  /* ────────────────────────────────────────────────────────────── */
  await viewSelect.selectOption('day');
  await expect(header).toContainText(/\w{3},/);
  await snap(page, ++step, 'day-view', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 12 — Week view                                          */
  /* ────────────────────────────────────────────────────────────── */
  await viewSelect.selectOption('week');
  await expect(header).toContainText(/Week:/);
  await snap(page, ++step, 'week-view', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 13 — Year view                                          */
  /* ────────────────────────────────────────────────────────────── */
  await viewSelect.selectOption('year');
  await expect(header).toContainText(/Year:\s*\d{4}/);
  await snap(page, ++step, 'year-view', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 14 — Agenda view                                        */
  /* ────────────────────────────────────────────────────────────── */
  await viewSelect.selectOption('agenda');
  await snap(page, ++step, 'agenda-view', subfolder);

  // return to month for rest of journey
  await viewSelect.selectOption('month');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 15 — Navigate next period                               */
  /* ────────────────────────────────────────────────────────────── */
  const initialHeader = await header.textContent();
  await page.click('button[data-action="next"]');
  const nextHeader = await header.textContent();
  expect(nextHeader).not.toBe(initialHeader);
  await snap(page, ++step, 'navigate-next-month', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 16 — Navigate prev period                               */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('button[data-action="prev"]');
  const prevHeader = await header.textContent();
  expect(prevHeader).toBe(initialHeader);
  await snap(page, ++step, 'navigate-prev-back', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 17 — Today button                                       */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('button[data-action="next"]');
  await page.click('button[data-action="next"]');
  await page.click('button[data-action="today"]');
  await expect(header).toContainText(String(new Date().getFullYear()));
  await snap(page, ++step, 'today-button-reset', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 18 — Search filter                                      */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="filters"] > summary');
  const search = page.locator('[data-action="search"]');
  await search.fill('Wellness');
  await expect(page.locator('#appointment-list')).toContainText('Wellness Check');
  await expect(page.locator('#appointment-list')).not.toContainText('Team Standup');
  await snap(page, ++step, 'search-filter-active', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 19 — Search no results                                  */
  /* ────────────────────────────────────────────────────────────── */
  await search.fill('NONEXISTENT_XYZZY');
  await expect(page.locator('#appointment-list')).toContainText('No appointments yet');
  await snap(page, ++step, 'search-no-results', subfolder);
  await search.fill('');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 20 — Status filter: confirmed only                      */
  /* ────────────────────────────────────────────────────────────── */
  await page.locator('[data-action="filter-status"]').selectOption('confirmed');
  await expect(page.locator('#appointment-list')).toContainText('Wellness Check');
  await expect(page.locator('#appointment-list')).not.toContainText('Team Standup');
  await snap(page, ++step, 'status-filter-confirmed', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 21 — Status filter: tentative only                      */
  /* ────────────────────────────────────────────────────────────── */
  await page.locator('[data-action="filter-status"]').selectOption('tentative');
  await expect(page.locator('#appointment-list')).toContainText('Team Standup');
  await expect(page.locator('#appointment-list')).not.toContainText('Wellness Check');
  await snap(page, ++step, 'status-filter-tentative', subfolder);

  // reset
  await page.locator('[data-action="filter-status"]').selectOption('all');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 22 — Date range filter (no results)                     */
  /* ────────────────────────────────────────────────────────────── */
  await page.locator('[data-action="filter-from-date"]').fill('2030-01-01');
  await page.locator('[data-action="filter-to-date"]').fill('2030-12-31');
  await expect(page.locator('#appointment-list')).toContainText('No appointments yet');
  await snap(page, ++step, 'date-range-filter-empty', subfolder);

  // clear date filters
  await page.locator('[data-action="filter-from-date"]').fill('');
  await page.locator('[data-action="filter-to-date"]').fill('');
  // close filters
  await page.click('details[data-group="filters"] > summary');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 23 — Sort toggle                                        */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="actions"] > summary');
  const sortBtn = page.locator('button[data-action="toggle-sort"]');
  const sortBefore = await sortBtn.textContent();
  await sortBtn.click();

  await page.click('details[data-group="actions"] > summary');
  const sortAfter = await page.locator('button[data-action="toggle-sort"]').textContent();
  expect(sortAfter).not.toBe(sortBefore);
  await snap(page, ++step, 'sort-toggled', subfolder);
  await page.click('details[data-group="actions"] > summary');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 24 — Appointment details via list click                 */
  /* ────────────────────────────────────────────────────────────── */
  const listItem = page.locator('#appointment-list [data-action="open-appointment-details"]', {
    hasText: 'Wellness Check',
  });
  await expect(listItem.first()).toBeVisible();
  await listItem.first().click();
  await expect(page.locator('#appointment-details-modal')).not.toHaveClass(/hidden/);
  await expect(page.locator('#appointment-details-content')).toContainText('Wellness Check');
  await snap(page, ++step, 'appointment-details-from-list', subfolder);

  // close details
  await page.click('#close-appointment-details-modal');
  await expect(page.locator('#appointment-details-modal')).toHaveClass(/hidden/);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP 25 — Appointment details via calendar click              */
  /* ────────────────────────────────────────────────────────────── */
  const calendarItem = page.locator('#calendar .calendar-item-trigger', { hasText: 'Wellness Check' });
  if (await calendarItem.count() > 0) {
    await calendarItem.first().click();
    await expect(page.locator('#appointment-details-modal')).not.toHaveClass(/hidden/);
    await snap(page, ++step, 'appointment-details-from-calendar', subfolder);

    /* ────────────────────────────────────────────────────────────── */
    /*  STEP 26 — Edit appointment                                   */
    /* ────────────────────────────────────────────────────────────── */
    await page.locator('[data-action="edit-appointment"]').click();
    await expect(page.locator('#appointment-details-modal')).toHaveClass(/hidden/);
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);
    await snap(page, ++step, 'edit-appointment-prefilled', subfolder);

    await page.locator('#appointment-create-form input[name="title"]').fill('Wellness Check (Updated)');
    await page.locator('#appointment-create-form button[type="submit"]').click();
    await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
    await expect(page.locator('#appointment-list')).toContainText('Wellness Check (Updated)');
    await snap(page, ++step, 'appointment-edited', subfolder);

    /* ────────────────────────────────────────────────────────────── */
    /*  STEP 28 — Delete appointment                                 */
    /* ────────────────────────────────────────────────────────────── */
    const calItem2 = page.locator('#calendar .calendar-item-trigger', { hasText: 'Wellness Check (Updated)' });
    if (await calItem2.count() > 0) {
      await calItem2.first().click();
      await expect(page.locator('#appointment-details-modal')).not.toHaveClass(/hidden/);
      await snap(page, ++step, 'appointment-details-before-delete', subfolder);

      page.once('dialog', /** @param {import('@playwright/test').Dialog} dialog */ async (dialog) => await dialog.accept());
      await page.locator('[data-action="delete-appointment"]').click();
      await expect(page.locator('#appointment-details-modal')).toHaveClass(/hidden/);
      await expect(page.locator('#appointment-list')).not.toContainText('Wellness Check (Updated)');
      await snap(page, ++step, 'appointment-deleted', subfolder);
    }
  }

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Modal ESC key dismiss                                 */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('button[data-action="open-new-appointment"]');
  await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
  await snap(page, ++step, 'modal-esc-dismissed', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Modal backdrop click dismiss                          */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('button[data-action="open-new-appointment"]');
  await expect(page.locator('#appointment-modal')).not.toHaveClass(/hidden/);
  await page.locator('#appointment-modal').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);
  await snap(page, ++step, 'modal-backdrop-dismissed', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Info panel overlay                                    */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="actions"] > summary');
  await page.click('button[data-action="toggle-info"]');
  await expect(page.locator('#info-panel')).not.toHaveClass(/hidden/);
  await snap(page, ++step, 'info-panel-open', subfolder);

  // close info panel
  const closeInfoBtn = page.locator('#info-panel [data-action="close-info"]');
  if (await closeInfoBtn.count() > 0) {
    await closeInfoBtn.click();
  } else {
    await page.locator('#info-panel').click({ position: { x: 5, y: 5 } });
  }
  await expect(page.locator('#info-panel')).toHaveClass(/hidden/);
  await snap(page, ++step, 'info-panel-closed', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Sync App modal                                        */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="actions"] > summary');
  await page.click('button[data-action="open-sync-app"]');
  await expect(page.locator('#sync-modal')).not.toHaveClass(/hidden/);
  await snap(page, ++step, 'sync-modal-open', subfolder);

  // close sync modal
  await page.click('#close-sync-modal');
  await expect(page.locator('#sync-modal')).toHaveClass(/hidden/);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Load sample state (dog vet care)                      */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="actions"] > summary');
  await page.click('button[data-action="load-state"]');
  await expect(page.locator('#state-load-modal')).not.toHaveClass(/hidden/);
  await snap(page, ++step, 'load-state-modal', subfolder);

  await page.locator('#load-state-sample').selectOption('dog-vet-care-state.json');
  page.once('dialog', /** @param {import('@playwright/test').Dialog} dialog */ async (dialog) => await dialog.accept());
  await page.locator('#state-load-form button[type="submit"]').click();
  await expect(page.locator('#state-load-modal')).toHaveClass(/hidden/);
  await expect(page.locator('#appointment-list')).toContainText('vaccine');
  await snap(page, ++step, 'sample-state-loaded-dog', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — All views with sample data                            */
  /* ────────────────────────────────────────────────────────────── */
  await snap(page, ++step, 'sample-data-month-view', subfolder);

  await viewSelect.selectOption('day');
  await snap(page, ++step, 'sample-data-day-view', subfolder);

  await viewSelect.selectOption('week');
  await snap(page, ++step, 'sample-data-week-view', subfolder);

  await viewSelect.selectOption('year');
  await snap(page, ++step, 'sample-data-year-view', subfolder);

  await viewSelect.selectOption('agenda');
  await snap(page, ++step, 'sample-data-agenda-view', subfolder);

  await viewSelect.selectOption('month');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Hierarchy drill-down (year → month)                   */
  /* ────────────────────────────────────────────────────────────── */
  await viewSelect.selectOption('year');
  const monthCell = page.locator('#calendar .hierarchy-cell').first();
  if (await monthCell.count() > 0) {
    await monthCell.click();
    const viewVal = await viewSelect.inputValue();
    expect(['month', 'week', 'day']).toContain(viewVal);
    await snap(page, ++step, 'hierarchy-drilldown', subfolder);
  }

  // return to month
  await viewSelect.selectOption('month');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Load empty state                                      */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="actions"] > summary');
  await page.click('button[data-action="load-state"]');
  await page.locator('#load-state-source').selectOption('empty');
  page.once('dialog', /** @param {import('@playwright/test').Dialog} dialog */ async (dialog) => await dialog.accept());
  await page.locator('#state-load-form button[type="submit"]').click();
  await expect(page.locator('#state-load-modal')).toHaveClass(/hidden/);
  await expect(page.locator('#appointment-list')).toContainText('No appointments yet');
  await snap(page, ++step, 'empty-state-loaded', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Save state via actions                                */
  /* ────────────────────────────────────────────────────────────── */
  // Create an appointment first so we have something to save
  await page.click('button[data-action="open-new-appointment"]');
  const form3 = page.locator('#appointment-create-form');
  await form3.locator('input[name="title"]').fill('Save Test Appt');
  await form3.locator('input[name="priority"]').fill('5');
  await form3.locator('button[type="submit"]').click();
  await expect(page.locator('#appointment-modal')).toHaveClass(/hidden/);

  // trigger save — handled via download dialog, just verify button works
  await page.click('details[data-group="actions"] > summary');
  const saveBtn = page.locator('button[data-action="save-state"]');
  await expect(saveBtn).toBeVisible();
  await snap(page, ++step, 'save-state-visible', subfolder);
  await page.click('details[data-group="actions"] > summary');

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Dropdown close on Escape key                          */
  /* ────────────────────────────────────────────────────────────── */
  await page.click('details[data-group="filters"] > summary');
  await expect(page.locator('details[data-group="filters"]')).toHaveAttribute('open', '');
  await snap(page, ++step, 'dropdown-open-before-dismiss', subfolder);
  // press Escape to close
  await page.keyboard.press('Escape');
  await expect(page.locator('details[data-group="filters"]')).not.toHaveAttribute('open', '');
  await snap(page, ++step, 'dropdown-closed-via-escape', subfolder);

  /* ────────────────────────────────────────────────────────────── */
  /*  STEP — Final clean state                                     */
  /* ────────────────────────────────────────────────────────────── */
  await snap(page, ++step, 'final-state', subfolder);
}

test.describe('Screenshot wireframe journey', () => {
  test.setTimeout(180000); // 3 minutes for both desktop + phone runs

  test.beforeAll(() => {
    // Ensure screenshot directories exist
    if (!fs.existsSync(SCREENSHOT_BASE_DIR)) {
      fs.mkdirSync(SCREENSHOT_BASE_DIR, { recursive: true });
    }
    if (!fs.existsSync(DESKTOP_DIR)) {
      fs.mkdirSync(DESKTOP_DIR, { recursive: true });
    }
    if (!fs.existsSync(PHONE_DIR)) {
      fs.mkdirSync(PHONE_DIR, { recursive: true });
    }
  });

  test('desktop (1280x800) full feature walkthrough with screenshots', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await screenshotJourney(page, DESKTOP_DIR);
  });

  test('phone (390x844) full feature walkthrough with screenshots', async ({ page }) => {
    // Set phone viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshotJourney(page, PHONE_DIR);
  });
});
