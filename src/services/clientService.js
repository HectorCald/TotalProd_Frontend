import apiClient, { getSucuId } from '../config/apiClient';

class clientService {

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

  // Obtener todos los clientes de una sucursal
  static async getAll(isActiveOrParams = null) {
    let isActive = isActiveOrParams;
    if (isActiveOrParams && typeof isActiveOrParams === 'object') {
      isActive = isActiveOrParams.is_active !== undefined ? isActiveOrParams.is_active : isActiveOrParams.status;
    }

    const params = new URLSearchParams();
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      params.append('is_active', String(isActive));
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/clients?${queryString}` : '/clients';

    return clientService._request(endpoint, { method: 'GET' }, {
      requireSucuId: true,
      throwOnError: true
    });
  }

  // Crear un cliente
  static async create(clientData) {
    return clientService._request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Eliminar un cliente
  static async delete(id) {
    return clientService._request(`/clients/${id}`, {
      method: 'DELETE'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Actualizar un cliente
  static async update(id, clientData) {
    return clientService._request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Actualizar múltiples clientes en lote
  static async bulkUpdate(clientesData) {
    return clientService._request('/clients/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ clientesData })
    }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Insertar únicamente location y description_location a un cliente
  static async updateLocation(id, location, description_location) {
    return clientService._request(`/clients/${id}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ location, description_location })
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }



  // Obtener un cliente por ID
  static async getById(id) {
    if (!id) {
      return {
        success: false,
        message: 'ID del cliente es requerido'
      };
    }
    
    return clientService._request(`/clients/${id}`, { method: 'GET' }, {
      requireSucuId: true,
      throwOnError: true
    });
  }
}

export default clientService;