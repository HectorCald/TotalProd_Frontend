import apiClient, { getSucuId, getEmpresaId } from '../config/apiClient';

// Función helper para obtener personal_id del token
const getPersonalId = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }
  return null;
};

class pedidosAlmacenService {

  static async _request(endpoint, options = {}, config = {}) {
    const {
      requireSucuId = false,
      requireEmpresaId = false,
      returnErrorObject = false,
      throwOnError = false,
      defaultData = undefined
    } = config;

    try {
      if (requireSucuId) {
        const sucuId = getSucuId();
        if (!sucuId) {
          return {
            success: false,
            message: 'No hay sucursal seleccionada',
            ...(defaultData !== undefined ? { data: defaultData } : {})
          };
        }
      }

      if (requireEmpresaId) {
        const empresaId = getEmpresaId();
        if (!empresaId) {
          return {
            success: false,
            message: 'No hay empresa seleccionada',
            ...(defaultData !== undefined ? { data: defaultData } : {})
          };
        }
      }

      const response = await apiClient.request(endpoint, options, requireSucuId, requireEmpresaId);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Error en la petición');
        error.status = response.status;
        error.code = data.code;
        error.currentPlan = data.currentPlan;
        error.requiredModule = data.requiredModule;
        throw error;
      }

      return data;
    } catch (error) {
      if (throwOnError || error.status === 403) {
        throw error;
      }
      
      if (returnErrorObject) {
        return {
          success: false,
          message: error.message || 'Error de conexión con el servidor',
          ...(defaultData !== undefined ? { data: defaultData } : {})
        };
      }
      
      return { success: false, message: error.message || 'Error de conexión con el servidor' };
    }
  }

  // Crear un pedido
  static async create(pedidoData) {
    const personalId = getPersonalId();
    const bodyObj = {
      ...pedidoData,
      personal_id: personalId
    };

    return pedidosAlmacenService._request('/pedidos-almacen', {
      method: 'POST',
      body: JSON.stringify(bodyObj)
    }, {
      requireSucuId: true,
      requireEmpresaId: true
    });
  }

  // Obtener todos los pedidos de la sucursal
  static async getAll(page = 1, limit = 10, searchQuery = null, estado = null, ordenamiento = 'fecha_desc', sucuIdParam = null, responsableId = null, filtroFecha = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ordenamiento: ordenamiento
    });

    if (sucuIdParam) {
      params.append('sucu_id', sucuIdParam);
    }

    if (searchQuery && searchQuery.trim() !== '') params.append('search', searchQuery);
    if (estado && estado.trim() !== '') params.append('estado', estado);
    if (responsableId) params.append('responsable_id', responsableId);
    if (filtroFecha) {
      if (filtroFecha.inicio) params.append('fecha_inicio', filtroFecha.inicio);
      if (filtroFecha.fin) params.append('fecha_fin', filtroFecha.fin);
    }

    return pedidosAlmacenService._request(`/pedidos-almacen?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam
    });
  }

  // Obtener un pedido por ID
  static async getById(pedidoId) {
    return pedidosAlmacenService._request(`/pedidos-almacen/${pedidoId}`, { method: 'GET' });
  }

  // Actualizar pedido completo
  static async update(pedidoId, pedidoData) {
    const personalId = getPersonalId();
    const bodyObj = {
      ...pedidoData,
      personal_id: personalId
    };

    return pedidosAlmacenService._request(`/pedidos-almacen/${pedidoId}`, {
      method: 'PUT',
      body: JSON.stringify(bodyObj)
    }, {
      requireSucuId: true,
      requireEmpresaId: true
    });
  }

  // DEPRECATED - Actualizar entrega de pedido - YA NO SE USA
  static async updateEntrega(pedidoId, pedidoData) {
    console.warn('updateEntrega está deprecado. Use los servicios individuales.');
    return { success: false, message: 'Este método está deprecado' };
  }

  // DEPRECATED - Entregar pedido - YA NO SE USA
  static async entregar(pedidoId, { sucu_id, precio_id, productos, metodo_pago }) {
    console.warn('entregar está deprecado. Use los servicios individuales.');
    return { success: false, message: 'Este método está deprecado' };
  }

  // Actualizar estado del pedido
  static async updateEstado(pedidoId, nuevoEstado, movimientoSalidaId = undefined, deudaId = undefined, movimientoEntradaId = undefined) {
    const body = { estado: nuevoEstado };
    
    if (movimientoSalidaId !== undefined) {
      body.movimiento_salida_id = movimientoSalidaId;
    }
    if (deudaId !== undefined) {
      body.deuda_id = deudaId;
    }
    if (movimientoEntradaId !== undefined) {
      body.movimiento_entrada_id = movimientoEntradaId;
    }

    return pedidosAlmacenService._request(`/pedidos-almacen/${pedidoId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  // Verificar si un producto tiene pedidos asociados
  static async verificarProductoEnPedidos(productoId) {
    return pedidosAlmacenService._request(`/pedidos-almacen/verificar-producto/${productoId}`, { method: 'GET' });
  }

  // Obtener todos los pedidos sin límite (para reportes)
  static async getAllSinLimite(sucuIdParam = null, filtroFecha = null, ordenamiento = 'fecha_desc') {
    const sucuId = sucuIdParam || getSucuId();
    const params = new URLSearchParams({
      page: '1',
      limit: '999999',
      sucu_id: sucuId || '',
      ordenamiento
    });

    if (filtroFecha) {
      if (filtroFecha.inicio) params.append('fecha_inicio', filtroFecha.inicio);
      if (filtroFecha.fin) params.append('fecha_fin', filtroFecha.fin);
    }

    return pedidosAlmacenService._request(`/pedidos-almacen?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam
    });
  }

  // Eliminar pedido
  static async eliminar(pedidoId) {
    return pedidosAlmacenService._request(`/pedidos-almacen/${pedidoId}`, { method: 'DELETE' });
  }

  // Obtener solicitantes únicos de todos los pedidos
  static async getSolicitantesUnicos() {
    return pedidosAlmacenService._request('/pedidos-almacen/solicitantes-unicos', { method: 'GET' }, {
      requireSucuId: true
    });
  }
}

export default pedidosAlmacenService;
