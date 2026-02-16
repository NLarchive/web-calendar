import { describe, expect, it, vi } from 'vitest';
import { PluginManager } from '../../src/plugins/pluginManager.js';

describe('pluginManager', () => {
  it('emits hooks in registration order', async () => {
    const manager = new PluginManager();
    const calls = [];

    manager.register({
      async beforeAppointmentCreate(payload) {
        calls.push(['a', payload.title]);
      },
    });

    manager.register({
      async beforeAppointmentCreate(payload) {
        calls.push(['b', payload.title]);
      },
    });

    await manager.emit('beforeAppointmentCreate', { title: 'Vet' });

    expect(calls).toEqual([
      ['a', 'Vet'],
      ['b', 'Vet'],
    ]);
  });

  it('ignores missing hooks safely', async () => {
    const manager = new PluginManager();
    const plugin = { otherHook: vi.fn() };
    manager.register(plugin);

    await manager.emit('afterAppointmentCreate', { title: 'X' });

    expect(plugin.otherHook).not.toHaveBeenCalled();
  });
});
