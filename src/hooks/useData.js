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

/**
 * Hook específico para clientes
 * @param {boolean} isOpen - Si el modal está abierto
 * @returns {object} { clientes, error, isLoading, refetch }
 */
export const useClientes = (isOpen = false) => {
  // Obtener sucu_id del localStorage para incluir en la key
  const getSucuId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.id;
    }
    return null;
  };

  const sucuId = getSucuId();

  // Solo crear key si el modal está abierto
  const key = isOpen && sucuId ? `clientes-${sucuId}` : null;

  const fetcher = async () => {
    console.log('fetcher clientes');
    const clientService = (await import('../services/clientService')).default;
    const response = await clientService.getAll();
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });

  return {
    clientes: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};

/**
 * Hook específico para proveedores
 * @param {boolean} isOpen - Si el modal está abierto
 * @returns {object} { proveedores, error, isLoading, refetch }
 */
export const useProveedores = (isOpen = false) => {
  // Obtener sucu_id del localStorage para incluir en la key
  const getSucuId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.id;
    }
    return null;
  };

  const sucuId = getSucuId();

  // Solo crear key si el modal está abierto
  const key = isOpen && sucuId ? `proveedores-${sucuId}` : null;

  const fetcher = async () => {
    console.log('fetcher proveedores');
    const proveedorService = (await import('../services/proveedorService')).default;
    const response = await proveedorService.getAll();
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });

  return {
    proveedores: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};

/**
 * Hook específico para personal
 * @param {boolean} isOpen - Si el modal está abierto
 * @returns {object} { personal, error, isLoading, refetch }
 */
export const usePersonal = (isOpen = false) => {
  // Obtener empresa_id del localStorage para incluir en la key
  const getEmpresaId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.empresas?.id;
    }
    return null;
  };

  const empresaId = getEmpresaId();
  
  // Solo crear key si el modal está abierto
  const key = isOpen && empresaId ? `personal-${empresaId}` : null;
  
  const fetcher = async () => {
    console.log('fetcher personal');
    const personalService = (await import('../services/personalService')).default;
    const response = await personalService.getAll();
    return response;
  };
  
  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });
  
  return {
    personal: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};

/**
 * Hook específico para productos de almacén general
 * @param {boolean} isOpen - Si el modal está abierto
 * @returns {object} { productos, error, isLoading, refetch }
 */
export const useProductosAlmacen = (isOpen = false) => {
  // Obtener sucu_id del localStorage para incluir en la key
  const getSucuId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.id;
    }
    return null;
  };

  const sucuId = getSucuId();

  // Solo crear key si el modal está abierto
  const key = isOpen && sucuId ? `productos-almacen-${sucuId}` : null;

  const fetcher = async () => {
    console.log('fetcher productos almacen');
    const productsAlmacenService = (await import('../services/productsAlmacenService')).default;
    const response = await productsAlmacenService.getAll();
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });

  return {
    productos: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};

/**
 * Hook específico para categorías de almacén
 * @param {boolean} isOpen - Si el modal está abierto
 * @returns {object} { categorias, error, isLoading, refetch }
 */
export const useCategoriasAlmacen = (isOpen = false) => {
  // Obtener empresa_id del localStorage para incluir en la key
  const getEmpresaId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.empresas?.id;
    }
    return null;
  };

  const empresaId = getEmpresaId();

  // Solo crear key si el modal está abierto
  const key = isOpen && empresaId ? `categorias-almacen-${empresaId}` : null;

  const fetcher = async () => {
    console.log('fetcher categorias almacen');
    const categoryAlmacenService = (await import('../services/categoryAlmacenService')).default;
    const response = await categoryAlmacenService.getAll();
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });

  return {
    categorias: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};

/**
 * Hook específico para categorías de acopio
 * @param {boolean} isOpen - Si el modal está abierto
 * @returns {object} { categorias, error, isLoading, refetch }
 */
export const useCategoriasAcopio = (isOpen = false) => {
  // Obtener empresa_id del localStorage para incluir en la key
  const getEmpresaId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.empresas?.id;
    }
    return null;
  };

  const empresaId = getEmpresaId();

  // Solo crear key si el modal está abierto
  const key = isOpen && empresaId ? `categorias-acopio-${empresaId}` : null;

  const fetcher = async () => {
    console.log('fetcher categorias acopio');
    const categoryAcopioService = (await import('../services/categoryAcopioService')).default;
    const response = await categoryAcopioService.getAll();
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });

  return {
    categorias: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};

/**
 * Hook específico para tipos de precios
 * @param {boolean} isOpen - Si el modal está abierto
 * @returns {object} { precios, error, isLoading, refetch }
 */
export const usePrecios = (isOpen = false) => {
  // Obtener empresa_id del localStorage para incluir en la key
  const getEmpresaId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.empresas?.id;
    }
    return null;
  };

  const empresaId = getEmpresaId();

  // Solo crear key si el modal está abierto
  const key = isOpen && empresaId ? `precios-${empresaId}` : null;

  const fetcher = async () => {
    console.log('fetcher precios');
    const pricesTypesService = (await import('../services/pricesTypesService')).default;
    const response = await pricesTypesService.getAll();
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    precios: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};

/**
 * Hook específico para sucursales
 * @param {string} empresaId - ID de la empresa
 * @returns {object} { sucursales, error, isLoading, refetch }
 */
export const useSucursales = (isOpen = false) => {
  // Solo crear key si el modal está abierto
  const key = isOpen ? 'sucursales' : null;

  const fetcher = async () => {
    console.log('fetcher sucursales');
    const sucursalesService = (await import('../services/sucursalesService')).default;
    const response = await sucursalesService.getByEmpresaId();
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: isOpen, // Solo revalidar al montar si está abierto
  });

  return {
    sucursales: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};

/**
 * Hook específico para movimientos de acopio
 * @param {string} searchQuery - Término de búsqueda
 * @param {number} page - Página actual
 * @param {string} tipoFiltro - Filtro de tipo (null, 'entrada', 'salida')
 * @param {string} ordenamiento - Ordenamiento
 * @returns {object} { movimientos, hasMorePages, error, isLoading, refetch }
 */
export const useMovimientosAcopio = (searchQuery = '', page = 1, isOpen = false, tipoFiltro = null, ordenamiento = 'fecha_desc') => {
  // Obtener sucu_id del localStorage para incluir en la key
  const getSucuId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.id;
    }
    return null;
  };

  const sucuId = getSucuId();

  // Solo crear key si el modal está abierto
  const key = isOpen && sucuId ? `movimientos-acopio-${sucuId}-${searchQuery}-${page}-${tipoFiltro || 'null'}-${ordenamiento}` : null;

  const fetcher = async () => {
    console.log('fetcher movimientos acopio');
    const movimientosAcopioService = (await import('../services/movimientosAcopioService')).default;
    const response = await movimientosAcopioService.getAll(page, 10, tipoFiltro, ordenamiento);
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0,
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });

  return {
    movimientos: data?.data || [],
    hasMorePages: data?.pagination?.hasNextPage || false,
    error,
    isLoading: isLoading,
    refetch: mutate
  };
};

/**
 * Hook específico para movimientos de almacén
 * @param {string} searchQuery - Término de búsqueda
 * @param {number} page - Página actual
 * @param {string} tipoFiltro - Filtro de tipo (null, 'entrada', 'salida')
 * @param {string} ordenamiento - Ordenamiento
 * @returns {object} { movimientos, hasMorePages, error, isLoading, refetch }
 */
export const useMovimientosAlmacen = (searchQuery = '', page = 1, isOpen = false, tipoFiltro = null, ordenamiento = 'fecha_desc') => {
  // Obtener sucu_id del localStorage para incluir en la key
  const getSucuId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.id;
    }
    return null;
  };

  const sucuId = getSucuId();

  // Solo crear key si el modal está abierto
  const key = isOpen && sucuId ? `movimientos-almacen-${sucuId}-${searchQuery}-${page}-${tipoFiltro || 'null'}-${ordenamiento}` : null;

  const fetcher = async () => {
    console.log('fetcher movimientos almacen');
    const movimientosAlmacenService = (await import('../services/movimientosAlmacenService')).default;
    const response = await movimientosAlmacenService.getAll(page, 10, tipoFiltro, ordenamiento);
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0,
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });

  return {
    movimientos: data?.data || [],
    hasMorePages: data?.pagination?.hasNextPage || false,
    error,
    isLoading: isLoading,
    refetch: mutate
  };
};

/**
 * Hook específico para pedidos de acopio
 * @param {string} searchQuery - Término de búsqueda
 * @param {number} page - Página actual
 * @param {string} ordenamiento - Ordenamiento
 * @returns {object} { pedidos, hasMorePages, error, isLoading, refetch }
 */
export const usePedidosAcopio = (searchQuery = '', page = 1, isOpen = false, ordenamiento = 'fecha_desc') => {
  // Obtener sucu_id del localStorage para incluir en la key
  const getSucuId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.id;
    }
    return null;
  };

  const sucuId = getSucuId();

  // Solo crear key si el modal está abierto
  const key = isOpen && sucuId ? `pedidos-acopio-${sucuId}-${searchQuery}-${page}-${ordenamiento}` : null;

  const fetcher = async () => {
    console.log('fetcher pedidos acopio');
    const pedidosAcopioService = (await import('../services/pedidosAcopioService')).default;
    const response = await pedidosAcopioService.getAll(page, 10, null, ordenamiento);
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0,
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    pedidos: data?.data || [],
    hasMorePages: data?.pagination?.hasNextPage || false,
    error,
    isLoading: isLoading,
    refetch: mutate
  };
};

/**
 * Hook específico para pedidos de almacén
 * @param {string} searchQuery - Término de búsqueda
 * @param {number} page - Página actual
 * @param {string} ordenamiento - Ordenamiento
 * @returns {object} { pedidos, hasMorePages, error, isLoading, refetch }
 */
export const usePedidosAlmacen = (searchQuery = '', page = 1, isOpen = false, ordenamiento = 'fecha_desc') => {
  // Obtener sucu_id del localStorage para incluir en la key
  const getSucuId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.id;
    }
    return null;
  };

  const sucuId = getSucuId();

  // Solo crear key si el modal está abierto
  const key = isOpen && sucuId ? `pedidos-almacen-${sucuId}-${searchQuery}-${page}-${ordenamiento}` : null;

  const fetcher = async () => {
    console.log('fetcher pedidos almacen');
    const pedidosAlmacenService = (await import('../services/pedidosAlmacenService')).default;
    const response = await pedidosAlmacenService.getAll(page, 20, null, ordenamiento);
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0,
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    pedidos: data?.data || [],
    hasMorePages: data?.pagination?.hasNextPage || false,
    error,
    isLoading: isLoading,
    refetch: mutate
  };
};

/**
 * Hook específico para productos de acopio
 * @param {boolean} isOpen - Si el modal está abierto
 * @returns {object} { productos, error, isLoading, refetch }
 */
export const useProductosAcopio = (isOpen = false) => {
  // Obtener empresa_id del localStorage para incluir en la key
  const getEmpresaId = () => {
    const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
    if (sucursalSeleccionada) {
      const parsed = JSON.parse(sucursalSeleccionada);
      return parsed.empresas?.id;
    }
    return null;
  };

  const empresaId = getEmpresaId();

  // Solo crear key si el modal está abierto
  const key = isOpen && empresaId ? `productos-acopio-${empresaId}` : null;

  const fetcher = async () => {
    console.log('fetcher productos acopio');
    const productsAcopioService = (await import('../services/productsAcopioService')).default;
    const response = await productsAcopioService.getAll();
    return response;
  };

  const { data, error, isLoading, mutate } = useData(key, fetcher, {
    refreshInterval: 0, // No revalidar automáticamente
    revalidateOnMount: true, // Siempre revalidar al montar
    revalidateOnFocus: false, // No revalidar al cambiar de ventana
    revalidateOnReconnect: false, // No revalidar al reconectar
  });

  return {
    productos: data?.data || [],
    error,
    isLoading: isLoading, // SIEMPRE mostrar loading cuando se ejecuta fetcher
    refetch: mutate
  };

};
