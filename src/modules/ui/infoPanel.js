export function renderInfoPanel(root, handlers = {}) {
  root.innerHTML = `
    <div class="info-panel-header">
      <h3>System Guide</h3>
      <button type="button" data-action="close-info" aria-label="Close info popup">✕</button>
    </div>
    <p class="small">Modular appointment scheduler for service and veterinary workflows.</p>
    <h4>Core Features</h4>
    <ul>
      <li>Day/Week/Month/Year calendar navigation.</li>
      <li>Priority-first sorting with date/time toggle.</li>
      <li>Recurring appointment expansion in all timeline views.</li>
      <li>State export/import and local persistence.</li>
      <li>Connector and plugin extension points for integrations.</li>
    </ul>
    <h4>Usage Flow</h4>
    <ol>
      <li>Click <strong>+ New Appointment</strong> in navbar.</li>
      <li>Create appointment and submit.</li>
      <li>Click any calendar item to open full details popup.</li>
      <li>Use Save/Load State to persist or load schedules.</li>
    </ol>
  `;

  root.querySelector('[data-action="close-info"]')?.addEventListener('click', () => {
    if (handlers.onClose) handlers.onClose();
    else root.classList.add('hidden');
  });
}

export function toggleInfoPanel(root) {
  root.classList.toggle('hidden');
}

export function closeInfoPanel(root) {
  root.classList.add('hidden');
}
