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

class productsAlmacenService {

  // Obtener todos los productos
  static async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/products-almacen`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener productos');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.getAll:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear un producto
  static async create(productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products-almacen`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear producto');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.create:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar un producto
  static async update(id, productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products-almacen/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar producto');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.update:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar un producto
  static async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products-almacen/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar producto');
      }

      return data;
    } catch (error) {
      console.error('Error en productsAlmacenService.delete:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }
}

export default productsAlmacenService;
