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

class pedidosAcopioService {

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

  static async create(pedidoData) {
    const personalId = getPersonalId();
    const bodyObj = {
      ...pedidoData,
      personal_id: personalId
    };

    return pedidosAcopioService._request('/pedidos-acopio', {
      method: 'POST',
      body: JSON.stringify(bodyObj)
    }, {
      requireSucuId: true,
      requireEmpresaId: true
    });
  }

  static async getAll(page = 1, limit = 10, searchQuery = null, estado = null, ordenamiento = 'fecha_desc', responsableId = null, filtroFecha = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ordenamiento: ordenamiento
    });
    
    if (searchQuery && searchQuery.trim() !== '') params.append('search', searchQuery);
    if (estado && estado.trim() !== '') params.append('estado', estado);
    if (responsableId) params.append('responsable_id', responsableId);
    if (filtroFecha) {
      if (filtroFecha.inicio) params.append('fecha_inicio', filtroFecha.inicio);
      if (filtroFecha.fin) params.append('fecha_fin', filtroFecha.fin);
    }
    
    return pedidosAcopioService._request(`/pedidos-acopio?${params}`, { method: 'GET' }, {
      requireEmpresaId: true
    });
  }

  static async getById(pedidoId) {
    return pedidosAcopioService._request(`/pedidos-acopio/${pedidoId}`, { method: 'GET' });
  }

  static async updateEstado(pedidoId, nuevoEstado, movimientoEntradaId = null) {
    const body = { estado: nuevoEstado };
    if (movimientoEntradaId) {
      body.movimiento_entrada_id = movimientoEntradaId;
    }
    
    return pedidosAcopioService._request(`/pedidos-acopio/${pedidoId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  static async verificarProductoEnPedidos(productoId) {
    return pedidosAcopioService._request(`/pedidos-acopio/verificar-producto/${productoId}`, { method: 'GET' });
  }

  static async eliminar(pedidoId) {
    return pedidosAcopioService._request(`/pedidos-acopio/${pedidoId}`, { method: 'DELETE' });
  }

  static async entregar(pedidoId, entregaData) {
    return pedidosAcopioService._request(`/pedidos-acopio/${pedidoId}/entregar`, {
      method: 'POST',
      body: JSON.stringify(entregaData)
    });
  }

  static async anularEntrega(pedidoId) {
    return pedidosAcopioService._request(`/pedidos-acopio/${pedidoId}/anular-entrega`, { method: 'POST' });
  }

  // Obtener solicitantes únicos de todos los pedidos
  static async getSolicitantesUnicos() {
    const empresaId = getEmpresaId();
    const params = new URLSearchParams({
      empresa_id: empresaId || ''
    });

    return pedidosAcopioService._request(`/pedidos-acopio/solicitantes-unicos?${params}`, { method: 'GET' }, {
      requireEmpresaId: true
    });
  }
}

export default pedidosAcopioService;