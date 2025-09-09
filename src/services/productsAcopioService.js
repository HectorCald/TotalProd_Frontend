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

class productsAcopioService {

  // Obtener todos los productos
  static async getAll(page = 1, limit = 20, search = '', categoria = null, ordenamiento = 'nombre_asc') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ordenamiento: ordenamiento,
        ...(search && { search }),
        ...(categoria !== null && { categoria }) // Solo agregar 'categoria' si no es null
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

  // Obtener un producto por ID
  static async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products-acopio/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error en getById:', error);
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

  // Crear un producto
  static async create(productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products-acopio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
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
        body: JSON.stringify(productData),
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
}

export default productsAcopioService;
