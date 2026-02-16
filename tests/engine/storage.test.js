import { describe, expect, it } from 'vitest';
import { loadFromLocalStorage, saveToLocalStorage } from '../../src/core/storage.js';

describe('storage', () => {
  it('saves and loads scheduler state', () => {
    const state = { appointments: [{ id: '1', title: 'A' }], viewMode: 'month' };

    saveToLocalStorage(state);
    const loaded = loadFromLocalStorage();

    expect(loaded.appointments.length).toBe(1);
    expect(loaded.viewMode).toBe('month');
  });
});
