export const OFFLINE_DB_NAME = 'totalprod_offline';
export const PRODUCTOS_STORE = 'productos_almacen';
export const CATEGORIAS_STORE = 'categorias_almacen';
export const PRECIOS_STORE = 'tipos_precios';
export const CLIENTES_STORE = 'clientes_offline';
export const MOVIMIENTOS_SALIDA_STORE = 'movimientos_salida_offline';

const DB_VERSION = 4;
const ALLOWED_STORES = [PRODUCTOS_STORE, CATEGORIAS_STORE, PRECIOS_STORE, CLIENTES_STORE, MOVIMIENTOS_SALIDA_STORE];

const ensureIndexedDB = () => {
    if (typeof window === 'undefined' || !window.indexedDB) {
        throw new Error('IndexedDB no está disponible en este entorno');
    }
    return window.indexedDB;
};

export async function initDB(STORE, DB) {
    if (!ALLOWED_STORES.includes(STORE)) {
        throw new Error(`Store ${STORE} no permitida. Usa una de: ${ALLOWED_STORES.join(', ')}`);
    }

    const indexedDBInstance = ensureIndexedDB();

    return new Promise((resolve, reject) => {
        const request = indexedDBInstance.open(DB, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            ALLOWED_STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
    });
}

export async function obtenerLocal(STORE, DB) {
    try {
        const db = await initDB(STORE, DB);
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);

        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result.map(item => item.data);
                resolve(items);
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error obtener desde el cache', error);
        return [];
    }
}

export async function guardarLocal(STORE, DB, items = []) {
    try {
        const db = await initDB(STORE, DB);
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);

        const dataArray = Array.isArray(items) ? items : [];

        store.clear();
        dataArray.forEach(item => {
            const itemId = item?.id ?? `${Date.now()}-${Math.random()}`;
            store.put({ id: itemId, data: item });
        });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('Error guardando en el cache', error);
        return false;
    }
}

export async function limpiarLocal(STORE, DB) {
    try {
        const db = await initDB(STORE, DB);
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        store.clear();

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('Error limpiando el cache', error);
        return false;
    }
}

export async function guardarRegistro(STORE, DB, data, customId = null) {
    try {
        const db = await initDB(STORE, DB);
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const recordId = customId || data?.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
        store.put({ id: recordId, data });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(recordId);
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('Error guardando registro en el cache', error);
        return null;
    }
}
