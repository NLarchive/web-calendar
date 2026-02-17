export async function fetchRepoVersion({
  fetchImpl = fetch,
  versionManifestPath = './version.json',
  signal,
} = {}) {
  const cacheBust = Date.now();
  const response = await fetchImpl(`${versionManifestPath}?__repo_update_check__=${cacheBust}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to read version manifest at ${versionManifestPath}`);
  }

  const manifest = await response.json();
  const version = manifest?.version || manifest?.sha || manifest?.buildId;
  if (!version) {
    throw new Error('Version manifest is missing a version field');
  }

  return String(version);
}

export function createRepoUpdateMonitor({
  versionManifestPath = './version.json',
  intervalMs = 60000,
  fetchImpl = fetch,
  onRepoUpdate,
  onCheckError,
} = {}) {
  let baselineVersion = null;
  let timerId = null;
  let currentRequestController = null;

  async function checkForUpdates() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return false;
    }

    if (currentRequestController) {
      currentRequestController.abort();
    }
    currentRequestController = new AbortController();

    try {
      const nextVersion = await fetchRepoVersion({
        fetchImpl,
        versionManifestPath,
        signal: currentRequestController.signal,
      });

      if (!baselineVersion) {
        baselineVersion = nextVersion;
        return false;
      }

      if (baselineVersion !== nextVersion) {
        const previousVersion = baselineVersion;
        baselineVersion = nextVersion;
        if (typeof onRepoUpdate === 'function') {
          onRepoUpdate({ previousVersion, nextVersion });
        }
        return true;
      }

      return false;
    } catch (error) {
      if (error?.name === 'AbortError') return false;
      if (typeof onCheckError === 'function') {
        onCheckError(error);
      }
      return false;
    } finally {
      currentRequestController = null;
    }
  }

  async function start() {
    await checkForUpdates();
    if (timerId || intervalMs <= 0) return;
    timerId = setInterval(() => {
      checkForUpdates();
    }, intervalMs);
  }

  function stop() {
    if (currentRequestController) {
      currentRequestController.abort();
      currentRequestController = null;
    }
    if (!timerId) return;
    clearInterval(timerId);
    timerId = null;
  }

  return {
    start,
    stop,
    checkForUpdates,
  };
}
