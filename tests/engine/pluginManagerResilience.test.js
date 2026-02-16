import { describe, expect, it, vi } from 'vitest';
import { PluginManager } from '../../src/plugins/pluginManager.js';

describe('pluginManager error resilience', () => {
  it('continues executing hooks when a plugin throws', async () => {
    const manager = new PluginManager();
    const secondPlugin = vi.fn();

    manager.register({
      async beforeAppointmentCreate() {
        throw new Error('Plugin A broke');
      },
    });

    manager.register({
      async beforeAppointmentCreate(payload) {
        secondPlugin(payload);
      },
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await manager.emit('beforeAppointmentCreate', { title: 'Test' });

    expect(secondPlugin).toHaveBeenCalledWith({ title: 'Test' });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});
