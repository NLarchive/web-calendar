import { describe, expect, it } from 'vitest';
import { CacheMemory } from '../../src/core/cacheMemory.js';

describe('cacheMemory', () => {
  it('stores and returns clones to avoid mutation leaks', () => {
    const cache = new CacheMemory();
    const original = { nested: { value: 1 } };

    cache.set('state', original);
    const loaded = cache.get('state');
    loaded.nested.value = 99;

    expect(cache.get('state').nested.value).toBe(1);
  });

  it('clears all keys', () => {
    const cache = new CacheMemory();
    cache.set('a', { ok: true });
    cache.clear();

    expect(cache.get('a')).toBeNull();
  });
});
