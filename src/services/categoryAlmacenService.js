import apiClient, { getEmpresaId } from '../config/apiClient';

// Helper for asociados companies
const getEmpresasAsociadasIds = () => {
  try {
    const SOCIOS_KEY = 'socios';
    const stored = localStorage.getItem(SOCIOS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const sociosIds = Array.isArray(parsed) ? parsed : [];
      return sociosIds.filter(id => id);
    }
    return [];
  } catch (error) {
    console.error('Error al obtener socios:', error);
    return [];
  }
};

class categoryAlmacenService {

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

      // apiClient.request(endpoint, options, includeSucuId, includeEmpresaId)
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
    const empresasAsociadasIds = getEmpresasAsociadasIds();
    const params = new URLSearchParams();
    if (empresasAsociadasIds && empresasAsociadasIds.length > 0) {
      empresasAsociadasIds.forEach(id => {
        params.append('empresas_asociadas', id);
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/category-almacen?${queryString}` : '/category-almacen';

    return categoryAlmacenService._request(endpoint, { method: 'GET' }, {
      requireEmpresaId: true,
      throwOnError: true
    });
  }

  // Crear una categoría
  static async create(categoryData) {
    return categoryAlmacenService._request('/category-almacen', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    }, {
      requireEmpresaId: true,
      returnErrorObject: true
    });
  }

  // Actualizar una categoría
  static async update(id, categoryData) {
    return categoryAlmacenService._request(`/category-almacen/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    }, {
      requireEmpresaId: false,
      returnErrorObject: true
    });
  }

  // Eliminar una categoría
  static async delete(id) {
    return categoryAlmacenService._request(`/category-almacen/${id}`, {
      method: 'DELETE'
    }, {
      requireEmpresaId: false,
      returnErrorObject: true
    });
  }
}

export default categoryAlmacenService;
