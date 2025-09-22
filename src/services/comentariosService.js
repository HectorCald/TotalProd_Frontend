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

class comentariosService {

  // Obtener todos los comentarios
  static async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/comentarios`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener comentarios');
      }

      return data;
    } catch (error) {
      console.error('Error en comentariosService.getAll:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear un comentario
  static async create(comentarioData) {
    try {
      const response = await fetch(`${API_BASE_URL}/comentarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(comentarioData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear comentario');
      }

      return data;
    } catch (error) {
      console.error('Error en comentariosService.create:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  // Crear un apoyo a un comentario
  static async createApoyo(apoyoData) {
    try {
      const response = await fetch(`${API_BASE_URL}/comentarios/apoyo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apoyoData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear apoyo');
      }

      return data;
    } catch (error) {
      console.error('Error en comentariosService.createApoyo:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  }
}

export default comentariosService;
