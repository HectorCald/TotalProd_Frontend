const OFFLINE_NETWORK_FLAG = 'offline_network_block';

let originalFetch = null;
let originalXHRSend = null;
let interceptorActive = false;

const createOfflineError = () => {
    const error = new Error('Modo offline activado. Las conexiones están bloqueadas.');
    error.name = 'OfflineNetworkError';
    return error;
};

const overrideFetch = () => {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    if (!originalFetch) {
        originalFetch = window.fetch.bind(window);
    }
    window.fetch = (...args) => Promise.reject(createOfflineError());
};

const overrideXMLHttpRequest = () => {
    if (typeof window === 'undefined' || !window.XMLHttpRequest) return;
    if (!originalXHRSend) {
        originalXHRSend = window.XMLHttpRequest.prototype.send;
    }

    const patchedSend = function patchedSend(...args) {
        if (interceptorActive) {
            const error = createOfflineError();
            if (typeof this.onerror === 'function') {
                setTimeout(() => this.onerror(error), 0);
            }
            throw error;
        }
        return originalXHRSend.apply(this, args);
    };

    window.XMLHttpRequest.prototype.send = patchedSend;
};

const restoreFetch = () => {
    if (typeof window === 'undefined') return;
    if (originalFetch) {
        window.fetch = originalFetch;
    }
};

const restoreXMLHttpRequest = () => {
    if (typeof window === 'undefined' || !window.XMLHttpRequest) return;
    if (originalXHRSend) {
        window.XMLHttpRequest.prototype.send = originalXHRSend;
    }
};

export const enableOfflineNetworkInterceptor = () => {
    if (interceptorActive) return;
    overrideFetch();
    overrideXMLHttpRequest();
    interceptorActive = true;
    try {
        localStorage.setItem(OFFLINE_NETWORK_FLAG, 'true');
    } catch (error) {
        console.warn('No se pudo registrar el estado de red offline:', error);
    }
};

export const disableOfflineNetworkInterceptor = () => {
    if (!interceptorActive) return;
    interceptorActive = false;
    restoreFetch();
    restoreXMLHttpRequest();
    try {
        localStorage.removeItem(OFFLINE_NETWORK_FLAG);
    } catch (error) {
        console.warn('No se pudo limpiar el estado de red offline:', error);
    }
};

export const initializeOfflineNetworkInterceptor = () => {
    if (typeof window === 'undefined') return;
    try {
        const shouldEnable = localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
        if (shouldEnable) {
            enableOfflineNetworkInterceptor();
        } else {
            disableOfflineNetworkInterceptor();
        }
    } catch (error) {
        console.warn('No se pudo inicializar el interceptor offline:', error);
    }
};

export { OFFLINE_NETWORK_FLAG };


