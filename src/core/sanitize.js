export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Show a non-blocking toast notification.
 * @param {string} message - Plain-text message (will be escaped).
 * @param {'info'|'error'|'success'} [type='info']
 */
export function showToast(message, type = 'info') {
  const container = typeof document !== 'undefined' && document.getElementById('toast-container');
  if (!container) {
    console.warn(message);
    return;
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = String(message ?? '');
  container.appendChild(toast);
  const timer = setTimeout(() => toast.remove(), 4000);
  toast.addEventListener('click', () => { clearTimeout(timer); toast.remove(); });
}
