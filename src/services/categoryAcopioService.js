import apiClient, { getEmpresaId } from '../config/apiClient';

class categoryAcopioService {

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
        const error = new Error(data.message || 'Error en la petición');
        error.status = response.status;
        error.code = data.code;
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

  // Obtener todas las categorías
  static async getAll() {
    return categoryAcopioService._request('/category-acopio', { method: 'GET' }, {
      requireEmpresaId: true,
      throwOnError: true
    });
  }

  // Crear una categoría
  static async create(categoryData) {
    return categoryAcopioService._request('/category-acopio', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Actualizar una categoría
  static async update(id, categoryData) {
    return categoryAcopioService._request(`/category-acopio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    }, {
      requireEmpresaId: false,
      returnErrorObject: true
    });
  }

  // Eliminar una categoría
  static async delete(id) {
    return categoryAcopioService._request(`/category-acopio/${id}`, {
      method: 'DELETE'
    }, {
      requireEmpresaId: false,
      returnErrorObject: true
    });
  }
}

export default categoryAcopioService;
