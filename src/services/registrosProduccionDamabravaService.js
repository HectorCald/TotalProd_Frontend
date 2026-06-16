import apiClient, { getSucuId, getEmpresaId } from '../config/apiClient';

class registrosProduccionDamabravaService {

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

  // Crear un nuevo registro de producción
  static async create(registroData) {
    return registrosProduccionDamabravaService._request('/registros-produccion-damabrava', {
      method: 'POST',
      body: JSON.stringify(registroData)
    }, {
      requireSucuId: true
    });
  }

  // Obtener registros de producción del usuario actual
  static async getByUser(page = 1, limit = 10, estado = null, ordenamiento = 'fecha_desc', search = '', rangoFechas = null) {
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
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (rangoFechas) {
      const { inicio, fin } = rangoFechas;
      if (inicio) {
        params.append('fecha_inicio', new Date(inicio).toISOString());
      }
      if (fin) {
        params.append('fecha_fin', new Date(fin).toISOString());
      }
    }

    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava/my-production?${params}`, {
      method: 'GET'
    });
  }

  // Obtener todos los registros de producción (sin filtrar por sucursal)
  static async getAll(
    page = 1,
    limit = 10,
    estado = null,
    ordenamiento = 'fecha_desc',
    search = '',
    responsable = null,
    rangoFechas = null
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
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (responsable && responsable.id && responsable.tipo) {
      params.append('responsable_id', responsable.id);
      params.append('responsable_tipo', responsable.tipo);
    }
    if (rangoFechas) {
      const { inicio, fin } = rangoFechas;
      if (inicio) {
        params.append('fecha_inicio', new Date(inicio).toISOString());
      }
      if (fin) {
        params.append('fecha_fin', new Date(fin).toISOString());
      }
    }

    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava?${params}`, {
      method: 'GET'
    });
  }

  // Obtener un registro de producción por ID
  static async getById(id) {
    if (!id) {
      return { success: false, message: 'ID es requerido' };
    }

    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava/${id}`, {
      method: 'GET'
    });
  }

  // Eliminar un registro de producción
  static async delete(registroId) {
    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava/${registroId}`, {
      method: 'DELETE'
    });
  }

  // Verificar un registro de producción
  static async verify(registroId, verificacionData) {
    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava/${registroId}/verify`, {
      method: 'PUT',
      body: JSON.stringify(verificacionData)
    });
  }

  // Anular verificación de un registro de producción
  static async unverify(registroId) {
    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava/${registroId}/unverify`, {
      method: 'PUT'
    });
  }

  // Actualizar cantidad ingresada de un registro de producción
  static async updateCantidadIngresada(registroId, cantidadIngresada) {
    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava/${registroId}/ingresar`, {
      method: 'PUT',
      body: JSON.stringify({
        cantidad_ingresada: cantidadIngresada
      })
    });
  }

  // Restar cantidad ingresada cuando se anula un movimiento de producción
  static async restarCantidadIngresada(registroId, cantidadARestar) {
    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava/${registroId}/restar-ingresada`, {
      method: 'PUT',
      body: JSON.stringify({
        cantidad_a_restar: cantidadARestar
      })
    });
  }

  // Obtener todos los registros de producción sin límite (para reportes)
  static async getAllSinLimite(estado = null, ordenamiento = 'fecha_desc', search = '', responsable = null) {
    const params = new URLSearchParams();

    if (estado) {
      params.append('estado', estado);
    }
    if (ordenamiento) {
      params.append('ordenamiento', ordenamiento);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (responsable && responsable.id && responsable.tipo) {
      params.append('responsable_id', responsable.id);
      params.append('responsable_tipo', responsable.tipo);
    }

    params.append('limit', '1000');

    return registrosProduccionDamabravaService._request(`/registros-produccion-damabrava?${params}`, {
      method: 'GET'
    });
  }
}

export default registrosProduccionDamabravaService;
