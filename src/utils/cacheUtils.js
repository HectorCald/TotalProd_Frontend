export const parseVersion = (v) => (v || '').split('.').map(n => parseInt(n, 10) || 0);

export const isGreater = (a, b) => {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const ai = pa[i] || 0;
    const bi = pb[i] || 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return false;
};

export const getLatestCacheVersion = async () => {
  if (!('caches' in window)) return null;
  const cacheNames = await caches.keys();
  const versions = cacheNames
    .map(name => {
      const m = name.match(/totalprod-cache-v(.+)/);
      return m ? m[1] : null;
    })
    .filter(Boolean);
  if (versions.length === 0) return null;
  return versions.reduce((max, cur) => (isGreater(cur, max) ? cur : max), versions[0]);
};

export const forceServiceWorkerUpdate = async () => {
  try {
    if (!navigator.serviceWorker) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.update) {
      await reg.update();
    }
  } catch (_) {}
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const waitForServiceWorkerReady = async (timeoutMs = 2000) => {
  try {
    if (!navigator.serviceWorker || !navigator.serviceWorker.ready) return false;
    const readyPromise = navigator.serviceWorker.ready.then(() => true);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), timeoutMs));
    return await Promise.race([readyPromise, timeoutPromise]);
  } catch (_) {
    return false;
  }
};

// Returns: { status: 'new'|'same'|'no_version'|'no_cache'|'error', latest?: string, stored?: string, error?: string }
export const checkCacheStatus = async (opts = {}) => {
  const { useLocalStorage = true, storedVersion } = opts;
  try {
    await waitForServiceWorkerReady(2000);
    await forceServiceWorkerUpdate();
    let latest = await getLatestCacheVersion();
    if (!latest) {
      // pequeño reintento por si el SW acaba de activarse
      await wait(500);
      await forceServiceWorkerUpdate();
      latest = await getLatestCacheVersion();
    }
    const stored = useLocalStorage ? localStorage.getItem('cacheVersion') : storedVersion;
    if (!latest) {
      // Fallback suave: reportar como "same" usando la versión almacenada (si existe)
      return { status: 'same', latest: stored || null, stored: stored || null };
    }
    // Si no hay versión guardada, retornar 'no_version' para guardarla automáticamente
    if (!stored) {
      return { status: 'no_version', latest, stored: null };
    }
    // Si hay versión guardada pero es diferente, retornar 'new' para mostrar modal
    if (stored !== latest) {
      return { status: 'new', latest, stored };
    }
    return { status: 'same', latest, stored };
  } catch (e) {
    return { status: 'error', error: String(e) };
  }
};


