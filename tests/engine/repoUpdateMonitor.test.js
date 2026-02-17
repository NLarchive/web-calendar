import { describe, expect, it, vi } from 'vitest';
import { createRepoUpdateMonitor, fetchRepoVersion } from '../../src/core/repoUpdateMonitor.js';

function buildResponse({ version = 'dev', ok = true }) {
  return {
    ok,
    json: async () => ({ version }),
  };
}

describe('repoUpdateMonitor', () => {
  it('reads version from version manifest using no-store fetch mode', async () => {
    const fetchImpl = vi.fn(async () => buildResponse({ version: 'sha-123' }));

    const version = await fetchRepoVersion({ fetchImpl, versionManifestPath: './version.json' });

    expect(version).toBe('sha-123');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toContain('./version.json?__repo_update_check__=');
    expect(options.cache).toBe('no-store');
  });

  it('sets a baseline on first check and triggers callback on version changes', async () => {
    const onRepoUpdate = vi.fn();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(buildResponse({ version: 'A1' }))
      .mockResolvedValueOnce(buildResponse({ version: 'A1' }))
      .mockResolvedValueOnce(buildResponse({ version: 'A2' }));

    const monitor = createRepoUpdateMonitor({
      versionManifestPath: './version.json',
      fetchImpl,
      onRepoUpdate,
      intervalMs: 0,
    });

    const firstCheck = await monitor.checkForUpdates();
    const secondCheck = await monitor.checkForUpdates();
    const thirdCheck = await monitor.checkForUpdates();

    expect(firstCheck).toBe(false);
    expect(secondCheck).toBe(false);
    expect(thirdCheck).toBe(true);
    expect(onRepoUpdate).toHaveBeenCalledTimes(1);
  });

  it('stops polling when stop is called', async () => {
    vi.useFakeTimers();

    const fetchImpl = vi.fn().mockResolvedValue(buildResponse({ version: 'A1' }));
    const monitor = createRepoUpdateMonitor({
      versionManifestPath: './version.json',
      fetchImpl,
      intervalMs: 1000,
    });

    await monitor.start();
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    monitor.stop();
    vi.advanceTimersByTime(3000);
    await Promise.resolve();
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
