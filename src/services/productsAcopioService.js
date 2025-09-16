import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseURL();

// Función helper para obtener el token de autorización
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Función helper para obtener empresa_id del localStorage
const getEmpresaId = () => {
  const sucursalSeleccionada = localStorage.getItem('sucursalSeleccionada');
  if (sucursalSeleccionada) {
    const parsed = JSON.parse(sucursalSeleccionada);
    return parsed.empresas?.id;
  }
  return null;
};

class productsAcopioService {

  // Obtener todos los productos
  static async getAll(page = 1, limit = 20, search = '', categoria = null, tipoMedida = null, ordenamiento = 'nombre_asc') {
    try {
      const empresaId = getEmpresaId();
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const params = new URLSearchParams({
        empresa_id: empresaId,
        page: page.toString(),
        limit: limit.toString(),
        ordenamiento: ordenamiento,
        ...(search && { search }),
        ...(categoria !== null && { categoria }), // Solo agregar 'categoria' si no es null
        ...(tipoMedida !== null && { tipo_medida: tipoMedida }) // Solo agregar 'tipo_medida' si no es null
      });


      const response = await fetch(`${API_BASE_URL}/products-acopio?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getAll:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Crear un producto
  static async create(productData) {
    try {
      const empresaId = getEmpresaId();
      if (!empresaId) {
        return {
          success: false,
          message: 'No hay empresa seleccionada'
        };
      }

      const response = await fetch(`${API_BASE_URL}/products-acopio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...productData,
          empresa_id: empresaId
        }),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en create:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar un producto
  static async delete(id) {
    try {

      const response = await fetch(`${API_BASE_URL}/products-acopio/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
        })
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en delete:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar un producto
  static async update(id, productData) {
    try {


      const response = await fetch(`${API_BASE_URL}/products-acopio/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...productData,
        }),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en update:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }





  // Obtener productos por categoría
  static async getByCategory(categoryId) {
    try {
      const response = await fetch(`${API_BASE_URL}/products-acopio/category/${categoryId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener productos de la categoría');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAcopioService.getByCategory:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Verificar si un producto tiene movimientos
  static async hasMovements(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products-acopio/${id}/has-movements`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en hasMovements:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
}

export default productsAcopioService;
