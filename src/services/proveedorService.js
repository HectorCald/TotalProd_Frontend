import apiClient, { getSucuId } from '../config/apiClient';

class proveedorService {

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

  // Obtener todos los proveedores de una sucursal
  static async getAll() {
    return proveedorService._request('/proveedores', { method: 'GET' }, {
      requireSucuId: true,
      throwOnError: true
    });
  }

  // Crear un proveedor
  static async create(proveedorData) {
    return proveedorService._request('/proveedores', {
      method: 'POST',
      body: JSON.stringify(proveedorData)
    }, {
      requireSucuId: true,
      returnErrorObject: true
    });
  }

  // Eliminar un proveedor
  static async delete(id) {
    return proveedorService._request(`/proveedores/${id}`, {
      method: 'DELETE'
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Actualizar un proveedor
  static async update(id, proveedorData) {
    return proveedorService._request(`/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proveedorData)
    }, {
      requireSucuId: false,
      returnErrorObject: true
    });
  }

  // Obtener un proveedor por ID
  static async getById(id) {
    if (!id) {
      return {
        success: false,
        message: 'ID del proveedor es requerido'
      };
    }
    
    return proveedorService._request(`/proveedores/${id}`, { method: 'GET' }, {
      requireSucuId: true,
      throwOnError: true
    });
  }
}

export default proveedorService;
