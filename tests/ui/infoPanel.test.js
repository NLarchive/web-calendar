import { describe, expect, it, vi } from 'vitest';
import { closeInfoPanel, renderInfoPanel, toggleInfoPanel } from '../../src/modules/ui/infoPanel.js';

describe('infoPanel', () => {
  it('renders updated guidance and close button', () => {
    const root = document.createElement('aside');
    renderInfoPanel(root);

    expect(root.innerHTML).toContain('System Guide');
    expect(root.querySelector('[data-action="close-info"]')).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const root = document.createElement('aside');
    const onClose = vi.fn();

    renderInfoPanel(root, { onClose });
    root.querySelector('[data-action="close-info"]').click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports toggle and explicit close helpers', () => {
    const root = document.createElement('aside');
    root.className = 'hidden';

    toggleInfoPanel(root);
    expect(root.classList.contains('hidden')).toBe(false);

    closeInfoPanel(root);
    expect(root.classList.contains('hidden')).toBe(true);
  });
});
