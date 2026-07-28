const RETRY_QUERY_PARAM = '__asset_retry';
const RETRY_STORAGE_KEY = 'prsk-calc:stale-asset-retry-at';
const RETRY_COOLDOWN_MS = 30_000;

export const isStaleAssetError = (error) => {
  const message = typeof error === 'string'
    ? error
    : error?.message || '';

  return /(?:failed to fetch dynamically imported module|loading chunk \d+ failed|chunkloaderror|importing a module script failed|failed to load module script)/i.test(message);
};

// A tab can keep an old main bundle open while a Pages deployment removes its
// old, content-hashed lazy chunks. Retry once with a cache-busting document URL
// instead of leaving the route on a blank screen.
export const installStaleAssetRecovery = (windowObject = window) => {
  if (!windowObject?.addEventListener) return () => {};

  try {
    const initialUrl = new URL(windowObject.location.href);
    if (initialUrl.searchParams.has(RETRY_QUERY_PARAM)) {
      initialUrl.searchParams.delete(RETRY_QUERY_PARAM);
      windowObject.history.replaceState(null, '', initialUrl.toString());
    }
  } catch {
    // URL cleanup is cosmetic; error recovery below still works without it.
  }

  const recover = (error) => {
    if (!isStaleAssetError(error)) return;

    try {
      const now = Date.now();
      const lastRetryAt = Number(windowObject.sessionStorage.getItem(RETRY_STORAGE_KEY) || 0);
      if (now - lastRetryAt < RETRY_COOLDOWN_MS) return;

      windowObject.sessionStorage.setItem(RETRY_STORAGE_KEY, String(now));
      const retryUrl = new URL(windowObject.location.href);
      retryUrl.searchParams.set(RETRY_QUERY_PARAM, String(now));
      windowObject.location.replace(retryUrl.toString());
    } catch {
      // Do not turn an already failed chunk load into an error loop.
    }
  };

  const onError = (event) => recover(event.error || event.message);
  const onUnhandledRejection = (event) => recover(event.reason);
  windowObject.addEventListener('error', onError, true);
  windowObject.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    windowObject.removeEventListener('error', onError, true);
    windowObject.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
};
