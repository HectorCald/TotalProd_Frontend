import apiClient, { getSucuId } from '../config/apiClient';

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

class movimientosAlmacenService {

  static async _request(endpoint, options = {}, config = {}) {
    const {
      requireSucuId = false,
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

      const response = await apiClient.request(endpoint, options, requireSucuId);
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
      if (throwOnError) {
        throw error;
      }
      
      if (returnErrorObject) {
        return {
          success: false,
          message: error.message || 'Error de conexión con el servidor',
          ...(defaultData !== undefined ? { data: defaultData } : {})
        };
      }
      
      return null;
    }
  }

  // Función auxiliar para validar el tamaño de los datos
  static validateDataSize(movimientoData) {
    const productos = movimientoData.productos || [];
    
    if (productos.length > 100) {
      return {
        valid: false,
        message: `Demasiados productos (${productos.length}). El máximo permitido es 100 productos por movimiento.`
      };
    }
    
    if (productos.length > 50) {
      return {
        valid: true,
        warning: `Procesando ${productos.length} productos. Esto puede tardar más tiempo.`
      };
    }
    
    return { valid: true };
  }

  // Crear un nuevo movimiento de almacén
  static async create(movimientoData) {
    try {
      const validation = this.validateDataSize(movimientoData);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const personalId = getPersonalId();
      const dataToSend = {
        ...movimientoData,
        personal_id: personalId
      };

      if (dataToSend.fecha instanceof Date) {
        dataToSend.fecha = dataToSend.fecha.toISOString();
      }
      if (dataToSend.numero_orden !== undefined && dataToSend.numero_orden !== null) {
        const numeroOrdenNormalizado = Number(dataToSend.numero_orden);
        dataToSend.numero_orden = Number.isNaN(numeroOrdenNormalizado) ? dataToSend.numero_orden : numeroOrdenNormalizado;
      }

      if (validation.warning) {
        console.warn(validation.warning);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

      try {
        const response = await this._request('/movimientos-almacen', {
          method: 'POST',
          body: JSON.stringify(dataToSend),
          signal: controller.signal
        }, {
          requireSucuId: true,
          throwOnError: true
        });

        clearTimeout(timeoutId);

        return {
          success: true,
          data: { id: response.id }
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: La operación tardó demasiado tiempo. Intenta con menos productos o verifica tu conexión.');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Error creando movimiento de almacén:', error);
      return {
        success: false,
        message: error.message || 'Error al crear el movimiento'
      };
    }
  }

  static async createFast(movimientoData) {
    const personalId = getPersonalId();
    const dataToSend = {
      ...movimientoData,
      personal_id: personalId
    };

    return this._request('/movimientos-almacen/fast', {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    }, {
      requireSucuId: true,
      returnErrorObject: true
    });
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

  // Obtener movimientos por tipo (entrada/salida)
  static async getByType(tipo, page = 1, limit = 30) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    return this._request(`/movimientos-almacen/tipo/${tipo}?${params}`, { method: 'GET' }, {
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

  // Obtener relaciones de un movimiento
  static async getRelations(id) {
    return this._request(`/movimientos-almacen/${id}/relations`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }


  // Anular un movimiento
  static async anular(movimientoId, desdePedido = false, esEdicion = false) {
    return this._request(`/movimientos-almacen/${movimientoId}/anular`, {
      method: 'PUT',
      body: JSON.stringify({ desdePedido, esEdicion })
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Anular un movimiento rápido de golpe
  static async anularFast(movimientoId) {
    return this._request(`/movimientos-almacen/${movimientoId}/anular-fast`, {
      method: 'PUT'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Eliminar un movimiento
  static async eliminar(movimientoId, esEdicion = false) {
    return this._request(`/movimientos-almacen/${movimientoId}`, {
      method: 'DELETE',
      body: JSON.stringify({ esEdicion })
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Obtener estadísticas optimizadas para gráficos (solo campos necesarios)
  static async getStatsForCharts(sucuIdParam = null) {
    const params = new URLSearchParams();
    if (sucuIdParam) params.append('sucu_id', sucuIdParam);
    
    const query = params.toString() ? `?${params}` : '';
    const requireSucuId = !sucuIdParam;

    return this._request(`/movimientos-almacen/stats/charts${query}`, { method: 'GET' }, {
      requireSucuId,
      returnErrorObject: true
    });
  }

  // Obtener categorías más vendidas del mes
  static async getCategoriasMasVendidas(sucuIdParam = null) {
    const params = new URLSearchParams();
    if (sucuIdParam) params.append('sucu_id', sucuIdParam);
    
    const query = params.toString() ? `?${params}` : '';
    const requireSucuId = !sucuIdParam;

    return this._request(`/movimientos-almacen/stats/categorias-mas-vendidas${query}`, { method: 'GET' }, {
      requireSucuId,
      returnErrorObject: true
    });
  }

  // Obtener todos los movimientos sin límite (para reportes y balance)
  static async getAllSinLimite(tipo = null, estado = null, ordenamiento = 'fecha_desc', sucuIdParam = null, filtroFecha = null) {
    const params = new URLSearchParams({
      page: '1',
      limit: '999999'
    });

    if (sucuIdParam) params.append('sucu_id', sucuIdParam);
    if (tipo) params.append('tipo', tipo);
    if (estado) params.append('estado', estado);
    if (ordenamiento) params.append('ordenamiento', ordenamiento);
    if (filtroFecha?.inicio) params.append('fecha_inicio', filtroFecha.inicio);
    if (filtroFecha?.fin) params.append('fecha_fin', filtroFecha.fin);

    const requireSucuId = !sucuIdParam;

    return this._request(`/movimientos-almacen/sin-limite?${params}`, { method: 'GET' }, {
      requireSucuId,
      returnErrorObject: true
    });
  }

  // Verificar si un producto tiene movimientos (ULTRA OPTIMIZADO)
  static async hasMovements(productId) {
    return this._request(`/movimientos-almacen/product/${productId}/has-movements`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Obtener movimientos por producto
  static async getByProduct(productId) {
    return this._request(`/movimientos-almacen/product/${productId}`, { method: 'GET' }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Obtener movimientos por cliente
  static async getByCliente(clienteId) {
    return this._request(`/movimientos-almacen/cliente/${clienteId}`, { method: 'GET' }, {
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

  // Actualizar un movimiento
  static async update(movimientoId, updateData) {
    return this._request(`/movimientos-almacen/${movimientoId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Eliminar productos de un movimiento
  static async deleteProductos(movimientoId) {
    return this._request(`/movimientos-almacen/${movimientoId}/productos`, {
      method: 'DELETE'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Crear productos de un movimiento
  static async createProductos(movimientoId, productosData) {
    return this._request(`/movimientos-almacen/${movimientoId}/productos`, {
      method: 'POST',
      body: JSON.stringify(productosData)
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }
}

export default movimientosAlmacenService;