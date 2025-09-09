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

class categoryAcopioService {

  // Obtener todas las categorías
  static async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/category-acopio`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener categorías');
      }

      return data;
    } catch (error) {
      console.error('Error en categoryAcopioService.getAll:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear una categoría
  static async create(categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/category-acopio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear categoría');
      }

      return data;
    } catch (error) {
      console.error('Error en categoryAcopioService.create:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar una categoría
  static async update(id, categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/category-acopio/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar categoría');
      }

      return data;
    } catch (error) {
      console.error('Error en categoryAcopioService.update:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar una categoría
  static async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/category-acopio/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar categoría');
      }

      return data;
    } catch (error) {
      console.error('Error en categoryAcopioService.delete:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }
}

export default categoryAcopioService;
