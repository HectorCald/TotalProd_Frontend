import apiClient, { getEmpresaId } from '../config/apiClient';

class pricesTypesService {

  static getEmpresaId() {
    return getEmpresaId();
  }

  static async _request(endpoint, options = {}, config = {}) {
    const {
      requireEmpresaId = false,
      returnErrorObject = false,
      throwOnError = false,
      defaultData = undefined
    } = config;

    try {
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

      const response = await apiClient.request(endpoint, options, false, requireEmpresaId);
      const data = await response.json();

      if (!response.ok) {
        // Handle special modules error to return the data directly
        if (data.code === 'MODULE_NOT_INCLUDED' || data.code === 'NO_PLAN') {
          return data;
        }

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
      
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Obtener todos los tipos de precios de una empresa
  static async getAll(empresaIdParam = null, includeSocios = true) {
    let endpoint = '/prices-types';
    const queryParams = [];
    
    if (empresaIdParam) {
      queryParams.push(`empresa_id=${empresaIdParam}`);
    }
    
    // Verificar si es empleado para enviar sucursal_id
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const decoded = JSON.parse(jsonPayload);
            if (decoded.type === 'employee') {
                const sucursalId = localStorage.getItem('sucursalIdSeleccionada');
                if (sucursalId) {
                    queryParams.push(`sucursal_id=${sucursalId}`);
                }
            }
        } catch (e) {
            console.error('Error al decodificar token en pricesTypesService', e);
        }
    }

    if (includeSocios) {
      // Obtener socios de localStorage y enviarlas
      try {
        const SOCIOS_KEY = 'socios';
        const stored = localStorage.getItem(SOCIOS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sociosIds = Array.isArray(parsed) ? parsed : [];
          if (sociosIds.length > 0) {
            sociosIds.forEach(id => {
              if (id) queryParams.push(`empresas_asociadas=${id}`);
            });
          }
        }
      } catch (e) {
        console.error('Error al obtener socios:', e);
      }
    }

    if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
    }

    return pricesTypesService._request(endpoint, { method: 'GET' }, {
      requireEmpresaId: !empresaIdParam
    });
  }

  // Obtener un tipo de precio por ID
  static async getById(id) {
    try {
      const response = await this.getAll();
      if (!response.success || !response.data) {
        return {
          success: false,
          message: response.message || 'No se pudo obtener el tipo de precio'
        };
      }
      const found = Array.isArray(response.data)
        ? response.data.find((p) => String(p.id) === String(id))
        : null;
      if (!found) {
        return {
          success: false,
          message: 'Tipo de precio no encontrado'
        };
      }
      return {
        success: true,
        data: found
      };
    } catch (error) {
      console.error('Error en pricesTypesService.getById:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener el tipo de precio'
      };
    }
  }

  // Crear un tipo de precio
  static async create(priceTypeData) {
    const empresaId = priceTypeData.empresa_id || getEmpresaId();
    const bodyData = { ...priceTypeData, empresa_id: empresaId };
    
    return pricesTypesService._request('/prices-types', {
      method: 'POST',
      body: JSON.stringify(bodyData)
    }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Actualizar un tipo de precio
  static async update(id, priceTypeData) {
    return pricesTypesService._request(`/prices-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(priceTypeData)
    }, {
      requireEmpresaId: false,
      returnErrorObject: true
    });
  }

  // Eliminar un tipo de precio
  static async delete(id) {
    return pricesTypesService._request(`/prices-types/${id}`, {
      method: 'DELETE'
    }, {
      requireEmpresaId: false,
      returnErrorObject: true
    });
    }
}

export default pricesTypesService;