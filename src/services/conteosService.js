import apiClient, { getSucuId, getEmpresaId } from '../config/apiClient';

class conteosService {

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
        const errorMessage = data.message || data.error?.message || 'Error en la petición';
        const error = new Error(errorMessage);
        error.status = response.status;
        error.code = data.code;
        error.currentPlan = data.currentPlan;
        error.requiredModule = data.requiredModule;
        error.originalError = data.error;
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

  static async create({ tipo, observaciones = null, detalles }) {
    const payload = {
      tipo,
      observaciones: observaciones || null,
      detalles
    };

    return conteosService._request('/conteos', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      requireSucuId: true
    });
  }

  static async getAll({ tipo = null } = {}) {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    
    const queryStr = params.toString() ? `?${params.toString()}` : '';

    return conteosService._request(`/conteos${queryStr}`, {
      method: 'GET'
    }, {
      requireSucuId: true,
      throwOnError: true
    });
  }

  static async delete(conteoId) {
    if (!conteoId) {
      return { success: false, message: 'ID del conteo es requerido' };
    }

    return conteosService._request(`/conteos/${conteoId}`, {
      method: 'DELETE'
    }, {
      requireSucuId: true
    });
  }

  static async replace(conteoId) {
    if (!conteoId) {
      return { success: false, message: 'ID del conteo es requerido' };
    }

    return conteosService._request(`/conteos/${conteoId}/replace`, {
      method: 'POST'
    }, {
      requireSucuId: true
    });
  }

  static async replaceAcopio(conteoId) {
    if (!conteoId) {
      return { success: false, message: 'ID del conteo es requerido' };
    }

    return conteosService._request(`/conteos/${conteoId}/replace-acopio`, {
      method: 'POST'
    }, {
      requireSucuId: true
    });
  }

  static async getDetalles(conteoId) {
    if (!conteoId) {
      return { success: false, message: 'ID del conteo es requerido' };
    }

    return conteosService._request(`/conteos/${conteoId}/detalles`, {
      method: 'GET'
    }, {
      requireSucuId: true
    });
  }
}

export default conteosService;