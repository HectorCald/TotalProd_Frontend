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

class cotizacionesService {

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
        const errorMessage = data.message || 'Error en la petición';
        const error = new Error(errorMessage);
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

  // Obtener una cotización por ID
  static async getById(cotizacionId) {
    return cotizacionesService._request(`/cotizaciones/${cotizacionId}`, {
      method: 'GET'
    }, {
      requireSucuId: true,
      requireEmpresaId: true
    });
  }

  static async getAll(
    page = 1,
    limit = 30,
    estado = null,
    ordenamiento = 'fecha_desc',
    clienteId = null,
    search = null,
    filtroFecha = null
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (estado) {
      params.append('estado', estado);
    }
    if (ordenamiento) {
      params.append('ordenamiento', ordenamiento);
    }
    if (clienteId) {
      params.append('cliente', clienteId);
    }
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }
    if (filtroFecha) {
      if (filtroFecha.fechaInicio || filtroFecha.fechaFin) {
        if (filtroFecha.fechaInicio) {
          params.append('fecha_inicio', filtroFecha.fechaInicio);
        }
        if (filtroFecha.fechaFin) {
          params.append('fecha_fin', filtroFecha.fechaFin);
        }
      } else {
        if (filtroFecha.inicio) {
          params.append('fecha_inicio', filtroFecha.inicio);
        }
        if (filtroFecha.fin) {
          params.append('fecha_fin', filtroFecha.fin);
        }
      }
    }

    return cotizacionesService._request(`/cotizaciones?${params}`, {
      method: 'GET'
    }, {
      requireSucuId: true,
      requireEmpresaId: true,
      throwOnError: true
    });
  }

  // Crear una nueva cotización
  static async create(cotizacionData) {
    const personalId = getPersonalId();
    const dataToSend = {
      ...cotizacionData,
      personal_id: personalId
    };

    return cotizacionesService._request('/cotizaciones', {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    }, {
      requireSucuId: true,
      requireEmpresaId: true
    });
  }

  // Crear cotización rápida de golpe
  static async createFast(cotizacionData) {
    const personalId = getPersonalId();
    const dataToSend = {
      ...cotizacionData,
      personal_id: personalId
    };

    return cotizacionesService._request('/cotizaciones/fast', {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    }, {
      requireSucuId: true,
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Actualizar estado de una cotización
  static async actualizarEstado(cotizacionId, estado) {
    return cotizacionesService._request(`/cotizaciones/${cotizacionId}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado })
    }, {
      requireSucuId: true,
      requireEmpresaId: true
    });
  }

  // Eliminar una cotización
  static async eliminar(cotizacionId) {
    return cotizacionesService._request(`/cotizaciones/${cotizacionId}`, {
      method: 'DELETE'
    }, {
      requireSucuId: true,
      requireEmpresaId: true
    });
  }
}

export default cotizacionesService;
