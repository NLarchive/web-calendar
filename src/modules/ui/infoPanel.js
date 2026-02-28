import { t } from '../../i18n/index.js';

export function renderInfoPanel(root, handlers = {}) {
  root.innerHTML = `
    <div class="modal-card info-panel-card">
      <button type="button" data-action="close-info" class="modal-close-sticky" aria-label="${t('info.closeInfoPopup')}">✕</button>
      <div class="info-panel-header">
        <h3>${t('info.systemGuide')}</h3>
      </div>
      <p class="small">${t('info.summary')}</p>
      <h4>${t('info.coreFeatures')}</h4>
      <ul>
        <li>${t('info.feature1')}</li>
        <li>${t('info.feature2')}</li>
        <li>${t('info.feature3')}</li>
        <li>${t('info.feature4')}</li>
        <li>${t('info.feature5')}</li>
      </ul>
      <h4>${t('info.usageFlow')}</h4>
      <ol>
        <li>${t('info.flow1')}</li>
        <li>${t('info.flow2')}</li>
        <li>${t('info.flow3')}</li>
        <li>${t('info.flow4')}</li>
      </ol>
    </div>
  `;

  root.querySelector('[data-action="close-info"]')?.addEventListener('click', () => {
    if (handlers.onClose) handlers.onClose();
    else root.classList.add('hidden');
  });

  root.addEventListener('click', (event) => {
    if (event.target !== root) return;
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
