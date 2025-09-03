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

class clientService {

  // Obtener todos los clientes
  static async getAll(page = 1, limit = 20, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`${API_BASE_URL}/clients?${params}`, {
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

  // Crear un cliente
  static async create(clientData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(clientData),
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


  // Eliminar un cliente
  static async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
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


  // Actualizar un cliente
  static async update(id, clientData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(clientData),
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

export default clientService;
