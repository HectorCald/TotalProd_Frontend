import apiClient, { getSucuId, getEmpresaId, getPersonalId } from '../config/apiClient';

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

    const result = await pedidosAlmacenService._request(`/pedidos-almacen?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam
    });

    if (result.success && result.data) {
      const currentSucuId = sucuIdParam || getSucuId();
      result.data = result.data.map(pedido => ({
        ...pedido,
        destino: pedido.sucursal_destino_id === currentSucuId
      }));
    }

    return result;
  }

  // Crear pedido
  static async create({ sucursal_destino_id, observaciones, precio_id, agrupado, fecha, date, productos }) {
    return pedidosAlmacenService._request('/pedidos-almacen', {
      method: 'POST',
      body: JSON.stringify({
        sucursal_destino_id,
        observaciones: observaciones || null,
        precio_id,
        agrupado: !!agrupado,
        fecha: fecha || date,
        productos
      })
    }, {
      requireSucuId: true
    });
  }

  // Actualizar pedido
  static async update(pedidoId, { observaciones, precio_id, sucursal_destino_id, agrupado, fecha, date, productos }) {
    return pedidosAlmacenService._request(`/pedidos-almacen/${pedidoId}`, {
      method: 'PUT',
      body: JSON.stringify({
        observaciones: observaciones || null,
        precio_id,
        sucursal_destino_id,
        agrupado: !!agrupado,
        fecha: fecha || date,
        productos
      })
    }, {
      requireSucuId: true,
      requireEmpresaId: true
    });
  }

  // Eliminar pedido
  static async delete(pedidoId) {
    return pedidosAlmacenService._request(`/pedidos-almacen/${pedidoId}`, { method: 'DELETE' });
  }

  // Obtener un pedido por ID
  static async getById(pedidoId) {
    const result = await pedidosAlmacenService._request(`/pedidos-almacen/${pedidoId}`, { method: 'GET' });
    if (result.success && result.data) {
      const currentSucuId = getSucuId();
      result.data.destino = result.data.sucursal_destino_id === currentSucuId;
    }
    return result;
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

  // Obtener solicitantes únicos de todos los pedidos
  static async getSolicitantesUnicos() {
    return pedidosAlmacenService._request('/pedidos-almacen/solicitantes-unicos', { method: 'GET' }, {
      requireSucuId: true
    });
  }
}

export default pedidosAlmacenService;