import apiClient, { getSucuId, getEmpresaId } from '../config/apiClient';

class movimientosAlmacenService {

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

  // Obtener todos los movimientos de la sucursal
  static async getAll(page = 1, limit = 30, tipo = null, estado = null, ordenamiento = 'fecha_desc', clienteId = null, sucuIdParam = null, search = null, filtroFecha = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (sucuIdParam) params.append('sucu_id', sucuIdParam);
    if (tipo) params.append('tipo', tipo);
    if (estado) params.append('estado', estado);
    if (ordenamiento) params.append('ordenamiento', ordenamiento);
    if (clienteId) params.append('cliente', clienteId);
    if (search && search.trim() !== '') params.append('search', search);
    if (filtroFecha?.inicio) params.append('fecha_inicio', filtroFecha.inicio);
    if (filtroFecha?.fin) params.append('fecha_fin', filtroFecha.fin);

    const requireSucuId = !sucuIdParam;

    return this._request(`/movimientos-almacen?${params}`, { method: 'GET' }, {
      requireSucuId,
      returnErrorObject: true
    });
  }

  // Obtener todos los movimientos sin límite (para reportes y balance)
  static async getAllSinLimite(tipo = null, fecha = null, estado = null) {
    let filtroFecha = fecha;
    let estadoFiltro = estado;

    if (typeof fecha === 'string' && (typeof estado === 'object' || !estado)) {
      estadoFiltro = fecha;
      filtroFecha = estado;
    }

    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (estadoFiltro) params.append('estado', estadoFiltro);
    if (filtroFecha?.inicio) params.append('fecha_inicio', filtroFecha.inicio);
    if (filtroFecha?.fin) params.append('fecha_fin', filtroFecha.fin);

    const query = params.toString() ? `?${params}` : '';

    return this._request(`/movimientos-almacen/sin-limite${query}`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Obtener un movimiento específico por ID
  static async getById(id) {
    return this._request(`/movimientos-almacen/${id}`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Crear movimiento
  static async create(movimientoData) {
    return this._request('/movimientos-almacen', {
      method: 'POST',
      body: JSON.stringify(movimientoData)
    }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Eliminar un movimiento
  static async delete(movimientoId, esEdicion = false) {
    return this._request(`/movimientos-almacen/${movimientoId}`, {
      method: 'DELETE',
      body: JSON.stringify({ esEdicion })
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Anular un movimiento
  static async anular(movimientoId) {
    return this._request(`/movimientos-almacen/${movimientoId}/anular`, {
      method: 'PUT'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Obtener relaciones de un movimiento
  static async getRelations(id) {
    return this._request(`/movimientos-almacen/${id}/relations`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Obtener movimientos por producción Damabrava
  static async getByProduccionDamabrava(produccionId) {
    return this._request(`/movimientos-almacen/produccion-damabrava/${produccionId}`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

}

export default movimientosAlmacenService;