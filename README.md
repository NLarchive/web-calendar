# Web Appointment System ✅

A lightweight, client-side appointment manager (HTML / JS / CSS) for scheduling services and tracking events with calendar visualization, priority sorting, and state save/load.

---

## Table of contents 📚
- [Summary](#summary)
- [Key features](#key-features)
- [Data model (inputs)](#data-model-inputs)
- [Example](#example)
- [UI & Behavior](#ui--behavior)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Testing](#testing)
- [GitHub Pages](#github-pages)
- [Production readiness](#production-readiness)
- [Roadmap](#roadmap)
- [Contributing & License](#contributing--license)

---

## Summary

This project provides a client-side engine to create, view and manage appointments. It focuses on an intuitive calendar UI (day/week/month/year), priority- and date-sorted timelines, and simple persistence (in-memory cache + save/load state file).

## Key features ✨

- Calendar views: Day, Week, Month, Year
- Timeline visualization with compact layout for conflicting/overlapping items
- Default sorting by **priority** with toggle to sort by **date/time**
- Recurrence support (basic/yearly example) and future-datetime management
- Save / Load state (export/import JSON file) and in-memory caching
- Current date/time display and navigation controls
- Info/help overlay and shared navbar for consistent UX
- Pure client-side (no backend required)

## Data model (inputs) 🧾

Each appointment contains the following fields:

- `date` — string, format `dd/mm/yyyy` (or ISO)
- `recurrence` — string (e.g., `none`, `daily`, `weekly`, `yearly`)
- `title` — string
- `description` — string
- `contact` — array of strings (links, phone numbers, emails)
- `category` — string
- `tags` — array of strings
- `priority` — integer (1-10, higher = more important)

### Example JSON

```json
{
  "date": "15/02/2026",
  "recurrence": "yearly",
  "title": "Dog vaccines",
  "description": "Vaccines for my dog",
  "contact": ["https://myvet.com", "123456789", "contact@myvet.com"],
  "category": "dog",
  "tags": ["vaccine", "dog"],
  "priority": 9
}
```

## UI & Behavior 🔧

- New appointment form opens as a popup from navbar button **+ New Appointment**.
- Day view shows hours and appointments placed in time slots.
- Week view groups 7 days with day-level details.
- Month view displays weeks; each day shows its appointments in priority order.
- Year view shows months and highlights days with scheduled items.
- Default sort: **priority** (descending). Use the toggle to sort by **date/time**.
- Save State button: downloads current state as JSON.
- Load State button: uploads a JSON file to restore state.
- Info button: explains UI features and usage tips.

## Project structure 🧩

- `src/core` → date utilities, scheduler engine, cache memory, storage, event bus
- `src/modules/calendar` → calendar controller and dedicated `day/week/month/year` views
- `src/modules/appointments` → appointment form + upcoming list components
- `src/modules/ui` → shared navbar and info/help panel
- `src/plugins` → plugin hooks manager for extension points
- `src/connectors` → open connector registry + MCP and GitHub-task-manager compatibility stubs
- `data` → ready-to-load sample state files for vet care calendars
- `tests/engine` and `tests/ui` → dedicated validation suite

## Quick start 🚀

1. Open `index.html` in a browser (client-side only).
2. (Optional) Serve locally for better file handling:
   - `python -m http.server 8000`
   - or `npx http-server .`
3. Install test dependencies:
  - `npm install`
4. Use the UI to create appointments, save state, and load saved JSON.
5. Load sample files from `data/` using **Load State**:
   - `data/dog-vet-care-state.json`
   - `data/cat-vet-care-state.json`
   - `data/combined-vet-care-state.json`

### Included veterinary samples

- Dog adult care calendar:
  - Annual vaccine booster
  - Internal deworming every 3 months (Q1/Q2/Q3/Q4)
  - Ectoparasite monthly control (pour-on/spray)
  - Ectoparasite collar check for 6-month replacement cycle
- Cat adult care calendar:
  - Annual vaccine booster (triple feline + rabies)
  - Internal deworming every 3 months (Q1/Q2/Q3/Q4)
  - Ectoparasite monthly control (pour-on/spray)
  - Ectoparasite collar check for 6-month replacement cycle

## Testing ✅

- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- Current coverage focus:
  - Engine normalization, recurrence expansion, sorting
  - Storage save/load behavior
  - Calendar rendering controller
  - Appointment form submission flow

## GitHub Pages 🌐

- This repository is structured as a static site and can run directly on GitHub Pages.
- Deployment workflow is included at `.github/workflows/deploy-pages.yml`.
- Ensure Pages is enabled in repository settings with **GitHub Actions** as source.
- Public URL target: `https://nlarchive.github.io/web-calendar/`

## Production readiness ✅

- Modular architecture (core, UI, calendar views, connectors, plugins)
- Automated test suite with reusable modular tests
- Open-source license included (`MIT`)
- GitHub Pages deployment workflow included
- `.gitignore` configured for clean repository commits

## Roadmap / TODO 📈

- Add advanced recurrence rules (RRULE)
- Notifications / reminders
- Drag & drop appointment rescheduling
- Mobile-responsive design and accessibility improvements
- Sync/import from external calendars (iCal, Google Calendar)

## Contributing & License 🤝

- Contributions welcome — open an issue or submit a PR.
- License: MIT (see `LICENSE`)
- Author: Nicolas Ivan Larenas Bustamante


