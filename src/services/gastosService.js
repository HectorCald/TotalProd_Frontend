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

class gastosService {

  static async _request(endpoint, options = {}, config = {}) {
    const {
      requireSucuId = false,
      requireEmpresaId = true,
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

  // Obtener gastos sin límite
  static async getAllSinLimite(sucuIdParam = null, filtroFecha = null) {
    const params = new URLSearchParams();
    if (sucuIdParam) params.append('sucu_id', sucuIdParam);
    if (filtroFecha) {
      if (filtroFecha.fechaStrInicio || filtroFecha.inicio) {
        params.append('fecha_inicio', filtroFecha.fechaStrInicio || filtroFecha.inicio.split('T')[0]);
      }
      if (filtroFecha.fechaStrFin || filtroFecha.fin) {
        params.append('fecha_fin', filtroFecha.fechaStrFin || filtroFecha.fin.split('T')[0]);
      }
    }
    
    return gastosService._request(`/gastos/sin-limite?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      throwOnError: true
    });
  }

  // Obtener todos los gastos con paginación y filtros
  static async getAll(page = 1, limit = 30, search = '', metodoPago = null, proveedor = null, ordenamiento = 'fecha_desc', sucuIdParam = null, filtroFecha = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ordenamiento: ordenamiento
    });
    
    if (sucuIdParam) {
      params.append('sucu_id', sucuIdParam);
    }

    if (search) {
      params.append('search', search);
    }
    if (metodoPago) {
      params.append('metodo_pago', metodoPago);
    }
    if (proveedor) {
      params.append('proveedor_id', proveedor);
    }
    if (filtroFecha) {
      if (filtroFecha.inicio) {
        params.append('fecha_inicio', filtroFecha.inicio);
      }
      if (filtroFecha.fin) {
        params.append('fecha_fin', filtroFecha.fin);
      }
    }

    return gastosService._request(`/gastos?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      throwOnError: true
    });
  }

  // Obtener un gasto por ID
  static async getById(id, empresaIdParam = null) {
    const empresaId = empresaIdParam || getEmpresaId();
    
    const params = new URLSearchParams();
    if (empresaId) {
      params.append('empresa_id', empresaId);
    }

    const endpoint = `/gastos/${id}${params.toString() ? `?${params.toString()}` : ''}`;

    return gastosService._request(endpoint, { method: 'GET' }, {
      requireEmpresaId: !empresaIdParam,
      throwOnError: true
    });
  }

  // Crear un nuevo gasto
  static async create(gastoData) {
    const personalId = getPersonalId();
    
    const bodyObj = {
      ...gastoData,
      personal_id: personalId
    };

    return gastosService._request('/gastos', {
      method: 'POST',
      body: JSON.stringify(bodyObj)
    }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Actualizar un gasto
  static async update(id, updateData) {
    return gastosService._request(`/gastos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Eliminar un gasto
  static async delete(id) {
    return gastosService._request(`/gastos/${id}`, {
      method: 'DELETE'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Obtener gastos por rango de fechas
  static async getByDateRange(fechaInicio, fechaFin, sucuIdParam = null) {
    const params = new URLSearchParams({
      fechaInicio: fechaInicio,
      fechaFin: fechaFin
    });
    
    if (sucuIdParam) {
      params.append('sucu_id', sucuIdParam);
    }

    return gastosService._request(`/gastos/por-fechas?${params}`, { method: 'GET' }, {
      requireSucuId: !sucuIdParam,
      returnErrorObject: true
    });
  }
}

export default gastosService;
