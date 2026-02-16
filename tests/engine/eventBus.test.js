import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../src/core/eventBus.js';

describe('eventBus', () => {
  it('emits payloads to listeners', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('state:updated', listener);
    bus.emit('state:updated', { ok: true });

    expect(listener).toHaveBeenCalledWith({ ok: true });
  });

  it('supports unsubscribe', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    const unsubscribe = bus.on('x', listener);
    unsubscribe();
    bus.emit('x', 1);

    expect(listener).not.toHaveBeenCalled();
  });
});
