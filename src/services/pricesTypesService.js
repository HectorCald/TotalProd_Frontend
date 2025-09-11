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

class pricesTypesService {

  // Obtener todos los tipos de precios
  static async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/prices-types`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener tipos de precios');
      }

      return data;
    } catch (error) {
      console.error('Error en pricesTypesService.getAll:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear un tipo de precio
  static async create(priceTypeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/prices-types`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(priceTypeData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear tipo de precio');
      }

      return data;
    } catch (error) {
      console.error('Error en pricesTypesService.create:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Actualizar un tipo de precio
  static async update(id, priceTypeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/prices-types/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(priceTypeData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar tipo de precio');
      }

      return data;
    } catch (error) {
      console.error('Error en pricesTypesService.update:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Eliminar un tipo de precio
  static async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/prices-types/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar tipo de precio');
      }

      return data;
    } catch (error) {
      console.error('Error en pricesTypesService.delete:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }
}

export default pricesTypesService;
