const MANUAL_LOCATION_OFF_KEY = 'ubicacion_desactivada_manual';
const BROWSER_GRANTED_CACHE_KEY = 'ubicacion_concedida_nav';

export const isLocationManuallyDisabled = () => {
  try {
    return localStorage.getItem(MANUAL_LOCATION_OFF_KEY) === 'true';
  } catch (_) {
    return false;
  }
};

export const setLocationManuallyDisabled = (disabled) => {
  try {
    if (disabled) {
      localStorage.setItem(MANUAL_LOCATION_OFF_KEY, 'true');
    } else {
      localStorage.removeItem(MANUAL_LOCATION_OFF_KEY);
    }
  } catch (_) {}
};

export const queryBrowserGeolocationState = async () => {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return 'unsupported';
  }

  if (navigator.permissions && typeof navigator.permissions.query === 'function') {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state; // 'granted' | 'prompt' | 'denied'
    } catch (_) {
      return 'unknown';
    }
  }

  return 'unknown';
};

export const verifyLocationPermissionActive = async () => {
  const browserState = await queryBrowserGeolocationState();

  if (browserState === 'unsupported') {
    return { active: false, browserState: 'unsupported' };
  }

  if (browserState === 'granted') {
    try {
      localStorage.setItem(BROWSER_GRANTED_CACHE_KEY, 'true');
    } catch (_) {}
    return {
      active: !isLocationManuallyDisabled(),
      browserState: 'granted',
    };
  }

  if (browserState === 'denied' || browserState === 'prompt') {
    try {
      localStorage.removeItem(BROWSER_GRANTED_CACHE_KEY);
    } catch (_) {}
    return {
      active: false,
      browserState,
    };
  }

  // Fallback para navegadores antiguos sin Permissions API
  let cachedGranted = false;
  try {
    cachedGranted = localStorage.getItem(BROWSER_GRANTED_CACHE_KEY) === 'true';
  } catch (_) {}

  return {
    active: cachedGranted && !isLocationManuallyDisabled(),
    browserState: 'unknown',
  };
};

export const markBrowserLocationGranted = (granted) => {
  try {
    if (granted) {
      localStorage.setItem(BROWSER_GRANTED_CACHE_KEY, 'true');
    } else {
      localStorage.removeItem(BROWSER_GRANTED_CACHE_KEY);
    }
  } catch (_) {}
};

