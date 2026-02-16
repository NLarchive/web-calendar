import { VIEW_MODES, SORT_MODES } from '../../core/constants.js';

export function renderNavbar(root, state, handlers) {
  root.className = 'navbar';
  root.innerHTML = `
    <strong>Appointment Scheduler</strong>
    <button class="primary" data-action="open-new-appointment">+ New Appointment</button>
    <button data-action="prev">◀</button>
    <button data-action="today">Today</button>
    <button data-action="next">▶</button>
    ${VIEW_MODES.map((mode) => `<button data-view="${mode}" class="${state.viewMode === mode ? 'active' : ''}">${mode}</button>`).join('')}
    <button data-action="open-sync-app">Sync App</button>
    <button data-action="toggle-sort">Sort: ${state.sortMode === SORT_MODES.PRIORITY ? 'Priority' : 'Date/Time'}</button>
    <button data-action="save-state">Save State</button>
    <button data-action="load-state">Load State</button>
    <button data-action="toggle-info">Info</button>
  `;

  root.querySelector('[data-action="prev"]').addEventListener('click', handlers.onPrev);
  root.querySelector('[data-action="open-new-appointment"]').addEventListener('click', handlers.onOpenNewAppointment);
  root.querySelector('[data-action="today"]').addEventListener('click', handlers.onToday);
  root.querySelector('[data-action="next"]').addEventListener('click', handlers.onNext);
  root.querySelector('[data-action="open-sync-app"]').addEventListener('click', handlers.onOpenSyncApp);
  root.querySelector('[data-action="toggle-sort"]').addEventListener('click', handlers.onToggleSort);
  root.querySelector('[data-action="save-state"]').addEventListener('click', handlers.onSaveState);
  root.querySelector('[data-action="load-state"]').addEventListener('click', handlers.onOpenLoadState);
  root.querySelector('[data-action="toggle-info"]').addEventListener('click', handlers.onToggleInfo);

  root.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => handlers.onViewChange(button.dataset.view));
  });
}
