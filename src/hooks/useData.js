import useSWR from 'swr';

// Configuración por defecto para toda la app
const defaultOptions = {
  revalidateOnFocus: true,         // Revalidar al cambiar de ventana (para ver cambios)
  revalidateOnReconnect: true,     // Revalidar al reconectar internet
  dedupingInterval: 0,         // 10 segundos entre peticiones duplicadas
  staleTime: 60000,               // 1 minuto de datos frescos (más corto)
  errorRetryCount: 3,             // 3 intentos en caso de error
  onError: (err) => console.error('SWR Error:', err)
};

/**
 * Hook genérico para manejar datos con SWR
 * @param {string} key - Clave única para el cache (ej: 'clientes', 'proveedores')
 * @param {function} fetcher - Función que hace la petición
 * @param {object} options - Opciones adicionales de SWR
 * @returns {object} { data, error, isLoading, mutate }
 */
export const useData = (key, fetcher, options = {}) => {
  return useSWR(key, fetcher, { ...defaultOptions, ...options });
};

